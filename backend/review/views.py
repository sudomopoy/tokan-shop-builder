from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone

from .models import ProductReview
from .serializers import (
    ProductReviewCreateSerializer,
    ProductReviewPublicSerializer,
    ProductReviewAdminSerializer,
)
from core.permissions import IsStoreCustomer, HasReviewsPermission


class ReviewPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class ProductReviewViewSet(viewsets.GenericViewSet):
    """
    API نظرات محصولات.
    - create: کاربر ثبت‌نام‌شده می‌تواند نظر بدهد (نیاز به StoreUser در فروشگاه)
    - list: لیست نظرات تایید شده یک محصول (عمومی)
    - admin_list: لیست همه نظرات برای داشبورد (ادمین/صاحب فروشگاه)
    - approve/reject: تایید یا رد نظر
    """

    queryset = ProductReview.objects.all()
    pagination_class = ReviewPagination

    def get_serializer_class(self):
        if self.action == "create":
            return ProductReviewCreateSerializer
        if self.action in ("approve", "reject", "admin_list"):
            return ProductReviewAdminSerializer
        return ProductReviewPublicSerializer

    def get_permissions(self):
        if self.action == "list":
            if self.kwargs.get("product_pk"):
                return [AllowAny()]
            return [HasReviewsPermission()]
        if self.action == "create":
            return [IsStoreCustomer()]
        return [HasReviewsPermission()]

    def get_queryset(self):
        qs = ProductReview.objects.select_related(
            "product",
            "store_user",
            "store_user__user",
        )
        store = getattr(self.request, "store", None)
        if store:
            qs = qs.filter(store=store)
        return qs

    def list(self, request, product_pk=None):
        """
        لیست نظرات:
        - اگر product_pk موجود باشد (از /product/<pk>/reviews/): لیست نظرات تایید شده آن محصول
        - اگر نباشد (از /review/): لیست admin برای داشبورد
        """
        if product_pk is not None:
            qs = self.get_queryset().filter(
                product_id=product_pk,
                status=ProductReview.STATUS_APPROVED,
            ).order_by("-created_at")
            serializer = ProductReviewPublicSerializer(qs, many=True)
            return Response(serializer.data)
        return self._admin_list(request)

    def create(self, request, product_pk=None):
        """ثبت نظر توسط کاربر ثبت‌نام‌شده."""
        store = getattr(request, "store", None)
        store_user = getattr(request, "store_user", None)

        if not store or not store_user:
            return Response(
                {"detail": "برای ثبت نظر باید در این فروشگاه ثبت‌نام کرده باشید."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from product.models import Product
        try:
            product = Product.objects.get(pk=product_pk, store=store)
        except Product.DoesNotExist:
            return Response(
                {"detail": "محصول یافت نشد."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if ProductReview.objects.filter(product=product, store_user=store_user).exists():
            return Response(
                {"detail": "شما قبلاً برای این محصول نظر ثبت کرده‌اید."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ProductReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = ProductReview.objects.create(
            product=product,
            store_user=store_user,
            store=store,
            rating=serializer.validated_data["rating"],
            body=serializer.validated_data.get("body", ""),
        )
        return Response(
            ProductReviewAdminSerializer(review).data,
            status=status.HTTP_201_CREATED,
        )

    def _admin_list(self, request):
        """لیست همه نظرات برای داشبورد (با فیلتر وضعیت و محصول)."""
        qs = self.get_queryset()
        status_filter = request.query_params.get("status")
        product_id = request.query_params.get("product")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if product_id:
            qs = qs.filter(product_id=product_id)
        qs = qs.order_by("-created_at")
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ProductReviewAdminSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ProductReviewAdminSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, url_path="admin-list", methods=["get"])
    def admin_list(self, request):
        """همان _admin_list برای URL صریح /review/admin-list/."""
        return self._admin_list(request)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """تایید نظر."""
        review = self.get_object()
        if review.status != ProductReview.STATUS_PENDING:
            return Response(
                {"detail": "این نظر قابل تایید نیست."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        review.status = ProductReview.STATUS_APPROVED
        review.approved_at = timezone.now()
        review.approved_by = request.user
        review.save()
        return Response(ProductReviewAdminSerializer(review).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """رد نظر."""
        review = self.get_object()
        if review.status != ProductReview.STATUS_PENDING:
            return Response(
                {"detail": "این نظر قابل رد نیست."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        review.status = ProductReview.STATUS_REJECTED
        review.approved_at = timezone.now()
        review.approved_by = request.user
        review.save()
        return Response(ProductReviewAdminSerializer(review).data)
