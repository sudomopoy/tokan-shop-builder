from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Wallet, Transaction, WithdrawRequest, WithdrawRequestStatus
from payment.models import Payment, PaymentGateway
from .serializers import (
    WalletSerializer,
    TransactionSerializer,
    WithdrawRequestSerializer,
    WithdrawRequestCreateSerializer,
)
from django.db import transaction as db_transaction
from .payment import *
from account.models import User
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.permissions import AllowAny
from order.models import Order
from django.conf import settings
from django.shortcuts import render
from store.models import Store
from django.core.cache import cache
from django.db.models import Q
from core.permissions import IsStoreCustomer, IsNotBanned
class WalletViewSet(generics.ListAPIView, viewsets.GenericViewSet):
    queryset = Wallet.objects.all()
    serializer_class = WalletSerializer
    permission_classes = [IsStoreCustomer]

    def get_queryset(self):
        """کیف پول سراسری - یک کیف پول به ازای هر کاربر"""
        wallet, _ = Wallet.objects.get_or_create(user=self.request.user)
        return Wallet.objects.filter(user=self.request.user)

    def get_permissions(self):
        # شارژ کیف پول سراسری - وابسته به فروشگاه نیست، فقط احراز هویت
        if self.action in ("charge_gateways", "charge_request_wallet"):
            return [IsNotBanned()]
        if self.action == "verify_payment":
            return [AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=["get"])
    def charge_gateways(self, request):
        """درگاه‌های شارژ کیف پول - همیشه از super_store (پلتفرم)"""
        from payment.serializers import PaymentGatewaySerializer
        super_store = Store.get_super_store()
        gateways = PaymentGateway.objects.filter(
            store=super_store
        ).select_related("gateway_type")
        serializer = PaymentGatewaySerializer(gateways, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "amount": openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="Description for field1",
                    default=10000,
                ),
                "gateway_id": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="payment gateway",
                    default="",
                ),
                "order_id": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="order id",
                ),
            },
            required=["amount", "gateway_id"],
        ),
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "status": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description="status",
                    ),
                    "payment_link": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description="payment link",
                    ),
                },
            )
        },
    )
    @action(detail=False, methods=["post"])
    def charge_request_wallet(self, request):
        """شارژ کیف پول سراسری - درگاه پرداخت پلتفرم (super_store)"""
        amount = request.data.get("amount")
        gateway_id = request.data.get("gateway_id")
        order_id = request.data.get("order_id", None)

        user = request.user
        wallet, _ = Wallet.objects.get_or_create(user=user)
        super_store = Store.get_super_store()
        try:
            gateway = PaymentGateway.objects.get(pk=gateway_id, store=super_store)
        except PaymentGateway.DoesNotExist:
            return Response({"error": "درگاه پرداخت نامعتبر است."}, status=400)
        try:
            payment = wallet.deposit_online(amount, gateway)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        if not payment:
            return Response({"error": "خطا در ایجاد درخواست پرداخت."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        cache.set(f'order:pending:{payment.pk}', order_id)
        return Response({"status": "payment initiated", "payment_link": payment.payment_link})

    @action(detail=False, methods=["post", "get"])
    def verify_payment(self, request):
        authority = request.query_params.get("Authority")
        status = request.query_params.get("Status")
        def _ctx(base, ptype="order", reason="failed"):
            return {"website_url_base": base, "payment_type": ptype, "failure_reason": reason}

        if status != "OK":
            if authority:
                try:
                    payment = Payment.objects.get(authority=authority)
                    sub = getattr(payment, "subscription_payment", None)
                    ss = getattr(payment, "smart_setup_payment", None)
                    if sub and sub.store:
                        website_url_base = sub.store.get_website_url()
                        ptype = "subscription"
                    elif ss and ss.smart_setup_request:
                        website_url_base = ss.smart_setup_request.store.get_website_url()
                        ptype = "smart_setup"
                    else:
                        website_url_base = payment.store.get_website_url() if payment.store else settings.WEBSITE_URL_BASE
                        order_attr = getattr(payment, "order", None)
                        ptype = "order" if order_attr else "wallet"
                    return render(
                        request,
                        "payment/payment_failed.html",
                        _ctx(website_url_base, ptype, "cancelled"),
                    )
                except Payment.DoesNotExist:
                    pass
            return Response("fail")

        payment = Payment.objects.get(authority=authority)
        gateway = payment.gateway
        payment_service = PaymentService.get_instance(gateway)
        state, ref_id, card_pan, fee = payment_service.verify_payment(
            PaymentVerifyRequest(amount=payment.amount, authority=authority)
        )
        order = getattr(payment, "order", None)
        if not order:
            order_id = cache.get(f"order:pending:{payment.pk}", None)
            if order_id:
                try:
                    order = Order.objects.get(pk=order_id)
                except Order.DoesNotExist:
                    order = None
        sub_payment = getattr(payment, "subscription_payment", None)
        smart_setup_payment = getattr(payment, "smart_setup_payment", None)
        if sub_payment and sub_payment.store:
            website_url_base = sub_payment.store.get_website_url()
            ptype = "subscription"
        elif smart_setup_payment and smart_setup_payment.smart_setup_request:
            store = smart_setup_payment.smart_setup_request.store
            website_url_base = store.get_website_url()
            ptype = "smart_setup"
        else:
            website_url_base = payment.store.get_website_url() if payment.store else settings.WEBSITE_URL_BASE
            ptype = "order" if order else "wallet"

        if state < 100:
            payment.status = "failed"
            payment.is_payed = False
            payment.save()
            return render(
                request,
                "payment/payment_failed.html",
                _ctx(website_url_base, ptype, "verification_failed"),
            )
        if state == 100:
            payment.complete()
            if order:
                order.complete_from_payment()
            if sub_payment:
                sub_payment.complete()
            if smart_setup_payment:
                pass  # SmartSetupRequest stays pending until admin marks done
        return render(
            request,
            "payment/payment_success.html",
            {
                "order_id": order.code if order else None,
                "trx_id": str(payment.id),
                "website_url_base": website_url_base,
                "payment_type": ptype,
            },
        )


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """تراکنش‌های کیف پول سراسری کاربر"""
        wallets = Wallet.objects.filter(user=self.request.user)
        return Transaction.objects.filter(
            Q(from_wallet__in=wallets) | Q(to_wallet__in=wallets)
        ).distinct().order_by("-timestamp")


class WithdrawRequestViewSet(
    viewsets.mixins.ListModelMixin,
    viewsets.mixins.RetrieveModelMixin,
    viewsets.mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """درخواست برداشت - کاربر: ثبت و مشاهده | ادمین: تایید/رد/واریز شد"""
    permission_classes = [IsAuthenticated]
    serializer_class = WithdrawRequestSerializer

    def get_queryset(self):
        if self.request.user.is_superuser:
            return WithdrawRequest.objects.all().select_related("wallet", "wallet__user").order_by("-created_at")
        wallet, _ = Wallet.objects.get_or_create(user=self.request.user)
        return WithdrawRequest.objects.filter(wallet=wallet).order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "create":
            return WithdrawRequestCreateSerializer
        return WithdrawRequestSerializer

    def create(self, request):
        """ثبت درخواست برداشت توسط کاربر - فقط از موجودی قابل برداشت"""
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        if wallet.withdrawable_balance <= 0:
            return Response({"error": "موجودی قابل برداشت کافی نیست."}, status=status.HTTP_400_BAD_REQUEST)
        ser = WithdrawRequestCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        amount = ser.validated_data["amount"]
        if amount > wallet.withdrawable_balance:
            return Response(
                {"error": f"موجودی قابل برداشت شما {wallet.withdrawable_balance} تومان است."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if amount < 1000:
            return Response({"error": "حداقل مبلغ برداشت ۱,۰۰۰ تومان است."}, status=status.HTTP_400_BAD_REQUEST)
        req = WithdrawRequest.objects.create(wallet=wallet, **ser.validated_data)
        return Response(WithdrawRequestSerializer(req).data, status=status.HTTP_201_CREATED)

    def list(self, request):
        """لیست درخواست‌های کاربر یا همه (ادمین)"""
        qs = self.get_queryset()
        ser = WithdrawRequestSerializer(qs, many=True)
        return Response(ser.data)

    def retrieve(self, request, pk=None):
        """جزئیات درخواست"""
        obj = self.get_object()
        return Response(WithdrawRequestSerializer(obj).data)

    def get_object(self):
        from rest_framework.generics import get_object_or_404
        qs = self.get_queryset()
        return get_object_or_404(qs, pk=self.kwargs.get("pk"))

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """تایید برداشت - فقط ادمین. مبلغ از کیف پول کسر می‌شود."""
        if not request.user.is_superuser:
            return Response({"error": "فقط ادمین سیستم می‌تواند تایید کند."}, status=status.HTTP_403_FORBIDDEN)
        wr = self.get_object()
        if wr.status != WithdrawRequestStatus.PENDING:
            return Response({"error": "فقط درخواست‌های در انتظار قابل تایید هستند."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            with db_transaction.atomic():
                amount = int(wr.amount)
                wr.wallet.sub_withdrawable(amount)
                txn = Transaction.objects.create(
                    from_wallet=wr.wallet,
                    withdrawable_amount=amount,
                    payment_method="withdrawal",
                    status="completed",
                    is_payed=True,
                )
                wr.transaction = txn
                wr.status = WithdrawRequestStatus.APPROVED
                wr.save()
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(WithdrawRequestSerializer(wr).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """رد برداشت - فقط ادمین. دلیل الزامی است."""
        if not request.user.is_superuser:
            return Response({"error": "فقط ادمین سیستم می‌تواند رد کند."}, status=status.HTTP_403_FORBIDDEN)
        wr = self.get_object()
        if wr.status != WithdrawRequestStatus.PENDING:
            return Response({"error": "فقط درخواست‌های در انتظار قابل رد هستند."}, status=status.HTTP_400_BAD_REQUEST)
        reason = request.data.get("rejection_reason", "").strip()
        if not reason:
            return Response({"error": "دلیل رد را وارد کنید. این متن به کاربر نمایش داده می‌شود."}, status=status.HTTP_400_BAD_REQUEST)
        from django.utils import timezone
        wr.rejection_reason = reason
        wr.rejected_at = timezone.now()
        wr.rejected_by = request.user
        wr.status = WithdrawRequestStatus.REJECTED
        wr.save()
        return Response(WithdrawRequestSerializer(wr).data)

    @action(detail=True, methods=["post"])
    def mark_deposited(self, request, pk=None):
        """واریز شد - فقط ادمین. شناسه واریز الزامی."""
        if not request.user.is_superuser:
            return Response({"error": "فقط ادمین سیستم می‌تواند واریز را ثبت کند."}, status=status.HTTP_403_FORBIDDEN)
        wr = self.get_object()
        if wr.status != WithdrawRequestStatus.APPROVED:
            return Response({"error": "فقط درخواست‌های تایید شده قابل واریز هستند."}, status=status.HTTP_400_BAD_REQUEST)
        ref_id = request.data.get("deposit_reference_id", "").strip()
        if not ref_id:
            return Response({"error": "شناسه واریز را وارد کنید."}, status=status.HTTP_400_BAD_REQUEST)
        from django.utils import timezone
        wr.deposit_reference_id = ref_id
        wr.deposited_at = timezone.now()
        wr.deposited_by = request.user
        wr.status = WithdrawRequestStatus.DEPOSITED
        wr.save()
        return Response(WithdrawRequestSerializer(wr).data)
