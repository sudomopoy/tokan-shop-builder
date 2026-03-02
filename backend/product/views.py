from django.db import transaction
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from account.models import StoreUser
from core.permissions import HasProductsPermission, IsStoreOwner
from core.viewset import BaseStoreViewSet
from .filters import ProductFilter
from .models import (
    InventoryAdjustmentLog,
    Product,
    StoreCartTierDiscount,
    Variant,
    VariantAttribute,
    VariantAttributeValue,
)
from .pagination import ProductPagination
from .serializers import (
    InventoryAdjustmentLogSerializer,
    ProductCreateUpdateSerializer,
    ProductInventoryAdjustSerializer,
    ProductSerializer,
    StoreCartTierDiscountSerializer,
    TorobProductSerializer,
    VariantAttributeSerializer,
    VariantAttributeValueSerializer,
)


class ProductViewSet(BaseStoreViewSet):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer
    pagination_class = ProductPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = ProductFilter
    search_fields = ["title"]
    lookup_field = "id"
    lookup_url_kwarg = "pk"

    def get_permissions(self):
        if self.action in ["retrieve", "list"]:
            return [AllowAny()]
        return [HasProductsPermission()]

    def _resolve_request_store_user(self):
        store_user = getattr(self.request, "store_user", None)
        if store_user:
            return store_user

        store = getattr(self.request, "store", None)
        user = getattr(self.request, "user", None)
        if not store or not user or not user.is_authenticated:
            return None

        return (
            StoreUser.objects.filter(store=store, user=user)
            .order_by("-level", "-is_admin", "-register_at")
            .first()
        )

    @staticmethod
    def _is_store_manager(store_user):
        if not store_user:
            return False
        return store_user.is_store_owner or store_user.has_section_permission("products", "read")

    def get_queryset(self):
        qs = super().get_queryset().prefetch_related(
            "allowed_customer_groups",
            "group_prices",
            "quantity_discounts",
            "variants",
        )
        if self.action in ["retrieve", "list"]:
            store_user = self._resolve_request_store_user()
            if not self._is_store_manager(store_user):
                qs = qs.filter(is_active=True)
                if store_user:
                    group_ids = store_user.active_group_ids
                    if group_ids:
                        qs = qs.filter(
                            Q(allowed_customer_groups__isnull=True)
                            | Q(allowed_customer_groups__id__in=group_ids)
                        )
                    else:
                        qs = qs.filter(allowed_customer_groups__isnull=True)
                else:
                    qs = qs.filter(allowed_customer_groups__isnull=True)
                qs = qs.distinct()
        return qs

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProductCreateUpdateSerializer
        return super().get_serializer_class()

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "categories",
                openapi.IN_QUERY,
                description="List of category IDs",
                type=openapi.TYPE_ARRAY,
                items=openapi.Items(type=openapi.TYPE_INTEGER),
                collectionFormat="multi",
            ),
            openapi.Parameter(
                "created_at__gte",
                openapi.IN_QUERY,
                description="Start date for created_at (YYYY-MM-DD)",
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_DATE,
            ),
            openapi.Parameter(
                "created_at__lte",
                openapi.IN_QUERY,
                description="End date for created_at (YYYY-MM-DD)",
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_DATE,
            ),
        ]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            ProductSerializer(serializer.instance, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}

        return Response(ProductSerializer(instance, context=self.get_serializer_context()).data)

    @action(detail=False, methods=["post"], url_path="bulk-action")
    def bulk_action(self, request):
        ids = request.data.get("ids", [])
        action_type = request.data.get("action")
        if not ids:
            return Response({"detail": "ids is required."}, status=status.HTTP_400_BAD_REQUEST)

        if action_type not in ("activate", "deactivate", "delete"):
            return Response(
                {"detail": "action must be one of: activate, deactivate, delete."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = self.get_queryset().filter(id__in=ids)
        count = qs.count()
        if action_type == "activate":
            updated = qs.update(is_active=True)
            return Response({"updated": updated, "message": f"{updated} products activated."})

        if action_type == "deactivate":
            updated = qs.update(is_active=False)
            return Response({"updated": updated, "message": f"{updated} products deactivated."})

        qs.delete()
        return Response({"deleted": count, "message": f"{count} products deleted."})

    @action(detail=True, methods=["post"])
    def set_main_variant(self, request, pk=None):
        product = self.get_object()
        if product.is_wholesale_mode:
            return Response(
                {"detail": "Wholesale mode does not allow setting a main variant."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        variant_id = request.data.get("variant_id")
        if not variant_id:
            return Response({"detail": "variant_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            variant = product.variants.get(id=variant_id)
        except Variant.DoesNotExist:
            return Response(
                {"detail": "Variant not found for this product"},
                status=status.HTTP_404_NOT_FOUND,
            )

        product.main_variant = variant
        product.price = variant.price
        product.sell_price = variant.sell_price
        product.cooperate_price = variant.cooperate_price
        product.save()

        return Response(ProductSerializer(product, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["get"], url_path="inventory-logs")
    def inventory_logs(self, request, pk=None):
        product = self.get_object()
        logs = (
            InventoryAdjustmentLog.objects.filter(product=product)
            .select_related("variant", "actor_store_user", "actor_user", "order")
            .order_by("-created_at")[:100]
        )
        return Response(InventoryAdjustmentLogSerializer(logs, many=True).data)

    @action(detail=True, methods=["post"], url_path="adjust-inventory")
    @transaction.atomic
    def adjust_inventory(self, request, pk=None):
        product = self.get_object()
        serializer = ProductInventoryAdjustSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        mode = serializer.validated_data["mode"]
        quantity = serializer.validated_data["quantity"]
        note = serializer.validated_data.get("note", "")
        variant_id = serializer.validated_data.get("variant_id")

        variant = None
        if variant_id:
            try:
                variant = product.variants.get(id=variant_id)
            except Variant.DoesNotExist:
                return Response(
                    {"detail": "Variant not found for this product."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        elif product.variants.exists():
            return Response(
                {"detail": "variant_id is required for products with variants."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target = variant or product
        quantity_before = target.stock or 0
        if mode == ProductInventoryAdjustSerializer.MODE_SET:
            quantity_after = quantity
            reason = InventoryAdjustmentLog.REASON_MANUAL_SET
        elif mode == ProductInventoryAdjustSerializer.MODE_INCREASE:
            quantity_after = quantity_before + quantity
            reason = InventoryAdjustmentLog.REASON_MANUAL_INCREASE
        else:
            if quantity > quantity_before:
                return Response(
                    {"detail": "Quantity to decrease is greater than current stock."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            quantity_after = quantity_before - quantity
            reason = InventoryAdjustmentLog.REASON_MANUAL_DECREASE

        target.stock = quantity_after
        if variant:
            variant.save(update_fields=["stock", "updated_at"])
        else:
            product.save(update_fields=["stock", "updated_at"])

        actor_store_user = getattr(request, "store_user", None)
        actor_user = request.user if request.user.is_authenticated else None
        log = InventoryAdjustmentLog.objects.create(
            store=request.store,
            product=product,
            variant=variant,
            reason=reason,
            quantity_before=quantity_before,
            quantity_after=quantity_after,
            quantity_change=quantity_after - quantity_before,
            note=note,
            actor_store_user=actor_store_user,
            actor_user=actor_user,
        )

        return Response(
            {
                "product_id": str(product.id),
                "variant_id": str(variant.id) if variant else None,
                "quantity_before": quantity_before,
                "quantity_after": quantity_after,
                "log_id": str(log.id),
            }
        )


class TorobProductViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TorobProductSerializer
    queryset = Product.objects.filter(is_active=True).order_by("-created_at")
    pagination_class = ProductPagination
    lookup_field = "code"


class VariantAttributeViewSet(BaseStoreViewSet):
    queryset = VariantAttribute.objects.all()
    serializer_class = VariantAttributeSerializer
    permission_classes = [IsStoreOwner]
    pagination_class = None
    search_fields = ["title", "slug"]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_system:
            return Response(
                {"detail": "Default attributes cannot be deleted."},
                status=status.HTTP_405_METHOD_NOT_ALLOWED,
            )
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_system and "slug" in request.data and request.data.get("slug") != instance.slug:
            return Response(
                {"detail": "Slug for default attributes cannot be changed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_system and "slug" in request.data and request.data.get("slug") != instance.slug:
            return Response(
                {"detail": "Slug for default attributes cannot be changed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=["get", "post"], url_path="values")
    def values(self, request, pk=None):
        attribute = self.get_object()
        if request.method == "GET":
            qs = VariantAttributeValue.objects.filter(
                store=attribute.store,
                attribute=attribute,
            ).order_by("sort_order", "title")
            return Response(VariantAttributeValueSerializer(qs, many=True).data)

        payload = dict(request.data)
        payload["attribute_id"] = str(attribute.id)
        serializer = VariantAttributeValueSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        serializer.save(store=attribute.store, attribute=attribute)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class VariantAttributeValueViewSet(BaseStoreViewSet):
    queryset = VariantAttributeValue.objects.all()
    serializer_class = VariantAttributeValueSerializer
    permission_classes = [IsStoreOwner]
    pagination_class = None
    search_fields = ["title", "code"]


class StoreCartTierDiscountViewSet(BaseStoreViewSet):
    queryset = StoreCartTierDiscount.objects.all().order_by("-min_value", "-discount_percent")
    serializer_class = StoreCartTierDiscountSerializer
    permission_classes = [HasProductsPermission]
    pagination_class = None
