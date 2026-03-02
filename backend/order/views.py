from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from decimal import Decimal
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

from core.viewset import BaseStoreViewSet
from .models import Order, OrderItem, ShippingMethod
from media.models import Media
from stream.utils import create_stream_token
from payment.models import Payment, PaymentGateway
from .serializers import (
    OrderSerializer,
    OrderDetailSerializer,
    OrderStoreUpdateSerializer,
    ShippingMethodSerializer,
    ShippingMethodUpdateSerializer,
    ShippingMethodCreateSerializer,
)
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import django_filters.rest_framework
from core.permissions import IsStoreCustomer, IsStoreOwner, HasOrdersPermission, IsStoreOwnerOnly, is_store_owner, store_user_has_permission

class OrderViewSet(BaseStoreViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsStoreCustomer]
    lookup_field = "code"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return OrderDetailSerializer
        if self.action in ("partial_update", "update"):
            return OrderStoreUpdateSerializer
        return OrderSerializer

    def get_permissions(self):
        if self.action == "sales_statistics":
            return [IsStoreOwnerOnly()]
        if self.action in ("partial_update", "update"):
            return [HasOrdersPermission()]
        return [IsStoreCustomer()]

    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        # Owner or admin with orders_read: sees all orders; customer: only own orders
        qs = Order.objects.filter(store=self.request.store).order_by("-created_at")
        can_see_all = is_store_owner(self.request) or store_user_has_permission(self.request, "orders", "read")
        if not can_see_all:
            qs = qs.filter(store_user=self.request.store_user)
        qs = qs.select_related("store_user", "store_user__user").prefetch_related(
            "items", "items__variant", "items__product", "items__product__main_image"
        )
        if self.action == "retrieve":
            qs = qs.select_related(
                "shipping_method", "delivery_address",
                "delivery_address__province", "delivery_address__city",
                "store_user", "store_user__user"
            )
        return qs

    def perform_update(self, serializer):
        order = serializer.instance
        new_status = serializer.validated_data.get("status")
        if new_status == "cancelled":
            order.cancel_order()
            return
        serializer.save()

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "items": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            "variant_id": openapi.Schema(type=openapi.TYPE_STRING),
                            "product_id": openapi.Schema(type=openapi.TYPE_STRING),
                            "quantity": openapi.Schema(type=openapi.TYPE_INTEGER),
                        },
                        required=["product_id", "quantity"],
                    ),
                ),
                "shipping_method": openapi.Schema(
                    type=openapi.TYPE_STRING,
                ),
                "delivery_address": openapi.Schema(
                    type=openapi.TYPE_STRING,
                ),
            },
            required=["items"],
        ),
        serializer_class=OrderSerializer,
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "id": openapi.Schema(
                        type=openapi.TYPE_STRING,
                    ),
                    "payable_amount": openapi.Schema(
                        type=openapi.TYPE_INTEGER,
                    ),
                    "items": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                "variant_id": openapi.Schema(type=openapi.TYPE_STRING),
                                "product_id": openapi.Schema(type=openapi.TYPE_STRING),
                                "quantity": openapi.Schema(type=openapi.TYPE_INTEGER),
                            },
                            required=["product_id", "quantity"],
                        ),
                    ),
                },
            )
        },
    )
    @action(detail=False, methods=["post"])
    @transaction.atomic
    def create_pre_order(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(store=request.store, store_user=request.store_user)
        return Response(
            self.get_serializer(order).data,
            status=status.HTTP_201_CREATED,
        )

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "order_id": openapi.Schema(type=openapi.TYPE_STRING),
                "gateway_id": openapi.Schema(type=openapi.TYPE_STRING),
            },
            required=["order_id", "gateway_id"],
        ),
    )
    @action(detail=False, methods=["post"])
    @transaction.atomic
    def init_order_payment(self, request, *args, **kwargs):
        """آغاز پرداخت سفارش از طریق درگاه - لینک پرداخت برمی‌گرداند"""
        try:
            # پرداخت سفارش فقط هنگامی مجاز است که فروشگاه دامنه اختصاصی خود را ثبت کرده باشد
            if request.store.is_shared_store:
                return Response(
                    {"error": "برای انجام پرداخت، ابتدا باید دامنه اختصاصی فروشگاه را ثبت و تایید کنید. از بخش تنظیمات > دامنه و آدرس درخواست تغییر دامنه را ثبت نمایید."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            order_id = request.data.get("order_id")
            gateway_id = request.data.get("gateway_id")
            if not order_id or not gateway_id:
                return Response(
                    {"error": "order_id و gateway_id الزامی است"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            order = Order.objects.get(pk=order_id)
            if order.store_user != request.store_user:
                return Response(
                    {"error": "سفارش یافت نشد."}, status=status.HTTP_404_NOT_FOUND
                )
            if order.status != "pending":
                return Response(
                    {"error": "وضعیت این سفارش قابل پرداخت نیست"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            gateway = PaymentGateway.objects.get(pk=gateway_id, store=request.store)
            payment = Payment.create_order_payment(order, gateway)
            return Response(
                {
                    "payment_link": payment.payment_link,
                    "authority": payment.authority,
                    "order_id": str(order.id),
                },
                status=status.HTTP_200_OK,
            )
        except Order.DoesNotExist:
            return Response({"error": "سفارش یافت نشد."}, status=status.HTTP_404_NOT_FOUND)
        except PaymentGateway.DoesNotExist:
            return Response({"error": "درگاه پرداخت یافت نشد."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=["get"], url_path="sales_statistics")
    def sales_statistics(self, request):
        """آمار فروش و درآمد فروشگاه - فقط برای مالک/ادمین فروشگاه"""
        store = request.store
        qs = Order.objects.filter(store=store)

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        last_30_days = today_start - timedelta(days=30)

        # شمارش بر اساس وضعیت
        total_orders = qs.count()
        paid_statuses = ["paid", "processing", "completed", "delivered"]
        paid_qs = qs.filter(status__in=paid_statuses)
        paid_orders_count = paid_qs.count()
        # درآمد فقط از فروش محصولات (بدون هزینه ارسال)
        total_revenue = paid_qs.aggregate(s=Sum("products_total_amount"))["s"] or Decimal("0")
        pending_count = qs.filter(status="pending").count()
        cancelled_count = qs.filter(status__in=["cancelled", "failed"]).count()
        delivered_count = qs.filter(status__in=["delivered", "completed"]).count()

        # درآمد امروز
        today_revenue = paid_qs.filter(created_at__gte=today_start).aggregate(
            s=Sum("products_total_amount")
        )["s"] or Decimal("0")

        # درآمد این ماه
        month_start = today_start.replace(day=1)
        month_revenue = paid_qs.filter(created_at__gte=month_start).aggregate(
            s=Sum("products_total_amount")
        )["s"] or Decimal("0")

        # نمودار درآمد روزانه - ۳۰ روز گذشته
        daily = (
            paid_qs.filter(created_at__gte=last_30_days)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Sum("products_total_amount"), orders_count=Count("id"))
            .order_by("day")
        )
        daily_map = {str(d["day"]): d for d in daily}
        revenue_by_day = []
        for i in range(30):
            d = (today_start - timedelta(days=29 - i)).date()
            d_str = str(d)
            rec = daily_map.get(d_str, {"revenue": Decimal("0"), "orders_count": 0})
            rev = rec.get("revenue") or Decimal("0")
            revenue_by_day.append(
                {
                    "date": d_str,
                    "revenue": str(rev),
                    "orders_count": rec.get("orders_count", 0),
                }
            )

        # ۱۰ سفارش اخیر با مبلغ
        recent_orders = (
            qs.order_by("-created_at")[:10]
            .values("id", "code", "payable_amount", "status", "created_at")
        )
        recent_list = [
            {
                "id": str(o["id"]),
                "code": o["code"],
                "payable_amount": str(o["payable_amount"]),
                "status": o["status"],
                "created_at": o["created_at"].isoformat() if o["created_at"] else None,
            }
            for o in recent_orders
        ]

        return Response(
            {
                "total_orders": total_orders,
                "total_revenue": str(total_revenue),
                "today_revenue": str(today_revenue),
                "month_revenue": str(month_revenue),
                "paid_orders_count": paid_orders_count,
                "pending_orders_count": pending_count,
                "cancelled_orders_count": cancelled_count,
                "delivered_orders_count": delivered_count,
                "revenue_by_day": revenue_by_day,
                "recent_orders": recent_list,
            }
        )

    @action(detail=False, methods=["get"], url_path="purchased-digital-content")
    def purchased_digital_content(self, request):
        """
        لیست محتوای دیجیتال خریداری‌شده (استریم یا دانلود) - فقط برای سفارشات پرداخت‌شده.
        برای ویجت ویدیوهای خریداری‌شده و دانلودهای من.
        """
        store_user = getattr(request, "store_user", None)
        if not store_user:
            return Response({"streaming": [], "download": []}, status=status.HTTP_200_OK)
        paid_statuses = ["paid", "processing", "completed", "delivered"]
        items = (
            OrderItem.objects.filter(
                order__store=request.store,
                order__store_user=store_user,
                order__status__in=paid_statuses,
                product__product_type="digital",
                product__is_active=True,
            )
            .select_related("product", "product__downloadable_file", "product__main_image")
            .order_by("-order__created_at")
        )
        streaming_list = []
        download_list = []
        seen_streaming = set()
        seen_download = set()
        for item in items:
            p = item.product
            if not p:
                continue
            if p.digital_subtype == "streaming" and p.id not in seen_streaming:
                has_stream = False
                stream_source = getattr(p, "streaming_source", "external_link") or "external_link"
                if stream_source == "external_link" and p.streaming_url:
                    has_stream = True
                elif stream_source == "uploaded" and getattr(p, "streaming_hls_path", None):
                    has_stream = True
                if has_stream:
                    seen_streaming.add(p.id)
                    token = create_stream_token(
                        str(p.id), str(item.id),
                        str(store_user.id), str(request.store.id)
                    )
                    play_url = request.build_absolute_uri(
                        f"/stream/play/{p.id}/"
                    ) + f"?token={token}"
                    streaming_list.append({
                        "id": str(p.id),
                        "order_item_id": str(item.id),
                        "title": p.title,
                        "stream_play_url": play_url,
                        "main_image": self._serialize_media(request, p.main_image),
                    })
            elif p.digital_subtype == "downloadable" and p.id not in seen_download:
                has_files = False
                files = []
                if getattr(p, "downloadable_files", None):
                    for entry in p.downloadable_files:
                        media_id = entry.get("media_id")
                        if not media_id:
                            continue
                        try:
                            m = Media.objects.get(id=media_id)
                        except (Media.DoesNotExist, ValueError):
                            continue
                        file_url = self._get_media_file_url(request, m)
                        if file_url:
                            has_files = True
                            files.append({
                                "title": entry.get("title") or m.title or "",
                                "description": entry.get("description") or "",
                                "download_url": file_url,
                            })
                if not has_files and p.downloadable_file_id:
                    f = p.downloadable_file
                    if f and f.file:
                        file_url = self._get_media_file_url(request, f)
                        if file_url:
                            has_files = True
                            files.append({"title": p.title, "description": "", "download_url": file_url})
                if has_files:
                    seen_download.add(p.id)
                    entry = {
                        "id": str(p.id),
                        "order_item_id": str(item.id),
                        "title": p.title,
                        "files": files,
                        "main_image": self._serialize_media(request, p.main_image),
                    }
                    if len(files) == 1:
                        entry["download_url"] = files[0]["download_url"]
                    download_list.append(entry)
        return Response({"streaming": streaming_list, "download": download_list}, status=status.HTTP_200_OK)

    def _serialize_media(self, request, media):
        if not media or not media.file:
            return None
        url = getattr(media.file, "url", None) or (media.file if isinstance(media.file, str) else "")
        if url and not url.startswith("http") and request:
            url = request.build_absolute_uri(url)
        return {"id": str(media.id), "file": url} if media else None

    def _get_media_file_url(self, request, media):
        if not media or not media.file:
            return ""
        url = getattr(media.file, "url", None) or (media.file if isinstance(media.file, str) else "")
        if url and not url.startswith("http") and request:
            url = request.build_absolute_uri(url)
        return url

    @action(detail=True, methods=["post"])
    def cancel_order(self, request, code=None):
        try:
            order = self.get_object()
            order.cancel_order()
            return Response({"status": "سفارش با موفقیت لغو شد."})
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ShippingMethodViewSet(BaseStoreViewSet):
    queryset = ShippingMethod.objects.all().select_related("definition")
    serializer_class = ShippingMethodSerializer
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("for_checkout") == "1":
            qs = qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return ShippingMethodCreateSerializer
        if self.action in ("partial_update", "update"):
            return ShippingMethodUpdateSerializer
        return ShippingMethodSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_system_method:
            return Response(
                {"error": "روش ارسال سیستمی قابل حذف نیست."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)
