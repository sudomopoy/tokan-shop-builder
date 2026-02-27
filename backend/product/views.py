# views.py
from django.conf import settings
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from .models import Product, Variant, VariantAttribute, VariantAttributeValue
from .serializers import (
    ProductSerializer, 
    TorobProductSerializer,
    ProductCreateUpdateSerializer,
    VariantAttributeSerializer,
    VariantAttributeValueSerializer,
)
from .pagination import ProductPagination
from .filters import ProductFilter
from core.viewset import BaseStoreViewSet
from core.permissions import IsStoreOwner, HasProductsPermission
from drf_yasg import openapi


PRODUCT_CACHE_TTL = 3 if settings.DEBUG else 10


class ProductViewSet(BaseStoreViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    pagination_class = ProductPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = ProductFilter 
    search_fields = ['title']
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'
    
    def get_permissions(self):
        if self.action in ["retrieve", "list"]:
            return [AllowAny()]
        return [HasProductsPermission()]

    def get_queryset(self):
        qs = super().get_queryset()
        # Public list/retrieve: only active products. Store owners see all.
        if self.action in ["retrieve", "list"]:
            from core.permissions import is_store_owner, store_user_has_permission
            is_owner = False
            if hasattr(self.request, "user") and self.request.user.is_authenticated:
                store = getattr(self.request, "store", None)
                if store and hasattr(self.request, "store_user") and self.request.store_user:
                    is_owner = is_store_owner(self.request) or store_user_has_permission(self.request, "products", "read")
                elif store:
                    from account.models import StoreUser
                    su = StoreUser.objects.filter(
                        store=store, user=self.request.user
                    ).order_by("-level", "-is_admin", "-register_at").first()
                    if su:
                        from types import SimpleNamespace
                        req = SimpleNamespace(store=store, store_user=su, user=self.request.user)
                        is_owner = is_store_owner(req) or store_user_has_permission(req, "products", "read")
            if not is_owner:
                qs = qs.filter(is_active=True)
        return qs
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return super().get_serializer_class()

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'categories', 
                openapi.IN_QUERY, 
                description="List of category IDs", 
                type=openapi.TYPE_ARRAY, 
                items=openapi.Items(type=openapi.TYPE_INTEGER),
                collectionFormat='multi' 
            ),
            openapi.Parameter(
                'created_at__gte', 
                openapi.IN_QUERY, 
                description="Start date for created_at (YYYY-MM-DD)", 
                type=openapi.TYPE_STRING, 
                format=openapi.FORMAT_DATE 
            ),
            openapi.Parameter(
                'created_at__lte', 
                openapi.IN_QUERY, 
                description="End date for created_at (YYYY-MM-DD)", 
                type=openapi.TYPE_STRING, 
                format=openapi.FORMAT_DATE 
            ),
        ]
    )
    @method_decorator(vary_on_headers('Host'))
    @method_decorator(cache_page(PRODUCT_CACHE_TTL))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @method_decorator(vary_on_headers('Host'))
    @method_decorator(cache_page(PRODUCT_CACHE_TTL))
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
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
            
        return Response(
            ProductSerializer(instance, context=self.get_serializer_context()).data
        )
    
    @action(detail=False, methods=['post'], url_path='bulk-action')
    def bulk_action(self, request):
        """اعمال گروهی: activate, deactivate, delete روی لیست محصولات."""
        ids = request.data.get('ids', [])
        action_type = request.data.get('action')
        if not ids:
            return Response({'detail': 'ids ضروری است.'}, status=status.HTTP_400_BAD_REQUEST)
        if action_type not in ('activate', 'deactivate', 'delete'):
            return Response(
                {'detail': 'action باید یکی از: activate, deactivate, delete باشد.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = self.get_queryset().filter(id__in=ids)
        count = qs.count()
        if action_type == 'activate':
            updated = qs.update(is_active=True)
            return Response({'updated': updated, 'message': f'{updated} محصول فعال شد.'})
        if action_type == 'deactivate':
            updated = qs.update(is_active=False)
            return Response({'updated': updated, 'message': f'{updated} محصول غیرفعال شد.'})
        if action_type == 'delete':
            qs.delete()
            return Response({'deleted': count, 'message': f'{count} محصول حذف شد.'})

    @action(detail=True, methods=['post'])
    def set_main_variant(self, request, pk=None):
        product = self.get_object()
        variant_id = request.data.get('variant_id')
        
        if not variant_id:
            return Response(
                {'detail': 'variant_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            variant = product.variants.get(id=variant_id)
        except Variant.DoesNotExist:
            return Response(
                {'detail': 'Variant not found for this product'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        product.main_variant = variant
        product.price = variant.price
        product.sell_price = variant.sell_price
        product.cooperate_price = variant.cooperate_price
        product.save()
        
        return Response(
            ProductSerializer(product, context=self.get_serializer_context()).data
        )


class TorobProductViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TorobProductSerializer
    queryset = Product.objects.filter(is_active=True).order_by('-created_at')
    pagination_class = ProductPagination
    lookup_field = 'code'


class VariantAttributeViewSet(BaseStoreViewSet):
    queryset = VariantAttribute.objects.all()
    serializer_class = VariantAttributeSerializer
    permission_classes = [IsStoreOwner]
    pagination_class = None  # برای dropdown ویژگی‌ها
    search_fields = ["title", "slug"]

    def destroy(self, request, *args, **kwargs):
        instance: VariantAttribute = self.get_object()
        if instance.is_system:
            return Response({"detail": "حذف ویژگی پیش‌فرض مجاز نیست."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance: VariantAttribute = self.get_object()
        if instance.is_system and "slug" in request.data and request.data.get("slug") != instance.slug:
            return Response({"detail": "slug ویژگی پیش‌فرض قابل تغییر نیست."}, status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance: VariantAttribute = self.get_object()
        if instance.is_system and "slug" in request.data and request.data.get("slug") != instance.slug:
            return Response({"detail": "slug ویژگی پیش‌فرض قابل تغییر نیست."}, status=status.HTTP_400_BAD_REQUEST)
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=["get", "post"], url_path="values")
    def values(self, request, pk=None):
        attribute: VariantAttribute = self.get_object()
        if request.method == "GET":
            qs = VariantAttributeValue.objects.filter(
                store=attribute.store, attribute=attribute
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
    pagination_class = None  # برای dropdown مقادیر ویژگی
    search_fields = ["title", "code"]