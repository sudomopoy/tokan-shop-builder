from decimal import Decimal
from django.db import transaction
from django.db.models import Prefetch
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    SubscriptionPlan,
    SubscriptionPlanDuration,
    SubscriptionDiscountCode,
    SubscriptionPayment,
)
from .serializers import (
    SubscriptionPlanSerializer,
    RenewSubscriptionSerializer,
    SubscriptionPaymentListSerializer,
)
from core.permissions import IsStoreCustomer, IsStoreOwnerOnly
from payment.models import Payment, PaymentGateway
from wallet.models import Wallet
from django.conf import settings


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """پلن‌های اشتراک - فقط خواندنی برای فروشگاه‌ها"""
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # لیست پلن‌ها معمولاً کم است، صفحه‌بندی لازم نیست

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(durations__is_active=True)
            .prefetch_related(
                Prefetch("durations", queryset=SubscriptionPlanDuration.objects.filter(is_active=True).order_by("duration_months"))
            )
            .distinct()
        )


class SubscriptionViewSet(viewsets.GenericViewSet):
    """مدیریت اشتراک فروشگاه - وضعیت، تمدید. history و renew فقط برای مالک."""
    permission_classes = [IsAuthenticated, IsStoreCustomer]

    def get_permissions(self):
        if self.action in ("history", "renew"):
            return [IsStoreOwnerOnly()]
        return [IsAuthenticated(), IsStoreCustomer()]

    @action(detail=False, methods=["get"])
    def history(self, request):
        """تاریخچه پرداخت‌های اشتراک فروشگاه"""
        store = request.store
        payments = SubscriptionPayment.objects.filter(store=store).select_related(
            "plan", "discount_code"
        ).order_by("-created_at")[:100]
        serializer = SubscriptionPaymentListSerializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def status(self, request):
        """وضعیت اشتراک فروشگاه فعلی"""
        store = request.store
        plan = getattr(store, "subscription_plan", None)
        return Response({
            "subscription_expires_at": (
                store.subscription_expires_at.isoformat()
                if store.subscription_expires_at else None
            ),
            "subscription_days_remaining": getattr(
                store, "subscription_days_remaining", None
            ),
            "subscription_plan": {
                "id": str(plan.id),
                "title": plan.title,
                "level": plan.level,
            } if plan else None,
            "is_expired": bool(
                store.subscription_expires_at
                and store.subscription_expires_at < __import__("django.utils.timezone", fromlist=["now"]).now()
            ),
            "is_expired_over_10_days": getattr(
                store, "is_subscription_expired_over_10_days", False
            ),
        })

    @action(detail=False, methods=["post"])
    def renew(self, request):
        """
        تمدید اشتراک - ایجاد درخواست پرداخت
        """
        store = request.store
        serializer = RenewSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        plan_id = data["plan_id"]
        duration_months = data["duration_months"]
        discount_code_str = (data.get("discount_code") or "").strip().upper()

        try:
            plan = SubscriptionPlan.objects.get(pk=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {"detail": "پلن یافت نشد."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            duration = SubscriptionPlanDuration.objects.get(
                plan=plan,
                duration_months=duration_months,
                is_active=True,
            )
        except SubscriptionPlanDuration.DoesNotExist:
            return Response(
                {"detail": "مدت انتخاب شده برای این پلن یافت نشد."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount = duration.final_price
        discount_code_obj = None

        if discount_code_str:
            try:
                discount_code_obj = SubscriptionDiscountCode.objects.get(
                    code__iexact=discount_code_str,
                    is_active=True,
                )
                ok, msg = discount_code_obj.is_valid(
                    plan=plan,
                    duration_months=duration_months,
                )
                if not ok:
                    return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
                discount_amount = discount_code_obj.apply_discount(amount)
                amount = amount - discount_amount
                if amount < 0:
                    amount = Decimal("0")
            except SubscriptionDiscountCode.DoesNotExist:
                return Response(
                    {"detail": "کد تخفیف معتبر نیست."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        amount_int = int(amount)
        wallet_amount_raw = data.get("wallet_amount", 0) or 0
        wallet_amount_int = min(max(0, int(wallet_amount_raw)), amount_int)
        gateway_amount_int = amount_int - wallet_amount_int

        wallet = None
        if wallet_amount_int > 0:
            # کیف پول سراسری - از کیف پول مالک فروشگاه استفاده می‌شود
            wallet, _ = Wallet.objects.get_or_create(user=store.owner)
            available = int(wallet.available_balance)
            if wallet_amount_int > available:
                return Response(
                    {
                        "detail": f"موجودی کیف پول کافی نیست. موجودی: {available} تومان",
                        "wallet_balance": available,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():
            payment = None
            if gateway_amount_int > 0:
                super_store = store.super_store
                gateway = PaymentGateway.objects.filter(
                    store=super_store,
                ).first()
                if not gateway:
                    return Response(
                        {"detail": "درگاه پرداخت پلتفرم تنظیم نشده است. با پشتیبانی تماس بگیرید."},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )
                from wallet.payment import PaymentService
                from wallet.payment import PaymentRequest

                payment_service = PaymentService.get_instance(gateway)
                payment_req = PaymentRequest(
                    amount=gateway_amount_int,
                    description=f"تمدید اشتراک {store.name} - {plan.title} - {duration_months} ماه",
                    mobile=store.owner.mobile or "09123456789",
                    email="info@tokan.app",
                    callback_url=(
                        (getattr(settings, "API_URL_BASE", "") or "")
                        + "/wallet/verify_payment/"
                    ),
                )
                authority, payment_link, success = payment_service.init_payment(payment_req)
                if not success:
                    return Response(
                        {"detail": "مشکلی در اتصال به درگاه پرداخت وجود دارد."},
                        status=status.HTTP_502_BAD_GATEWAY,
                    )
                payment = Payment.objects.create(
                    store=super_store,
                    amount=gateway_amount_int,
                    gateway=gateway,
                    order=None,
                    transaction=None,
                    is_online_payment=True,
                    status="pending",
                    authority=authority,
                    payment_link=payment_link or "",
                )

            if wallet_amount_int > 0 and wallet:
                wallet.purchase(amount=wallet_amount_int, can_use_gift=True)

            sub_payment = SubscriptionPayment.objects.create(
                store=store,
                payment=payment,
                plan=plan,
                duration_months=duration_months,
                amount=amount,
                discount_code=discount_code_obj,
                status="pending",
            )

            if gateway_amount_int == 0:
                sub_payment.complete()

        payment_link = None
        if payment:
            payment_link = payment.payment_link

        return Response({
            "payment_link": payment_link,
            "subscription_payment_id": str(sub_payment.id),
            "completed": gateway_amount_int == 0,
        })

    @action(detail=False, methods=["post"], url_path="verify-discount")
    def verify_discount(self, request):
        """اعتبارسنجی کد تخفیف"""
        code = (request.data.get("code") or "").strip().upper()
        plan_id = request.data.get("plan_id")
        duration_months = request.data.get("duration_months")

        if not code:
            return Response({"valid": False, "detail": "کد وارد کنید."})

        try:
            discount_code = SubscriptionDiscountCode.objects.get(
                code__iexact=code,
                is_active=True,
            )
        except SubscriptionDiscountCode.DoesNotExist:
            return Response({"valid": False, "detail": "کد تخفیف معتبر نیست."})

        plan = None
        if plan_id:
            try:
                plan = SubscriptionPlan.objects.get(pk=plan_id)
            except SubscriptionPlan.DoesNotExist:
                pass

        ok, msg = discount_code.is_valid(
            plan=plan,
            duration_months=duration_months,
        )
        if not ok:
            return Response({"valid": False, "detail": msg})

        return Response({
            "valid": True,
            "discount_type": discount_code.discount_type,
            "discount_value": float(discount_code.discount_value),
        })
