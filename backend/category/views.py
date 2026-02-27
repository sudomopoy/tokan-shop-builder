# category/views.py
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category
from .filters import CategoryFilter
from .serializers import (
    CategorySerializer,
    CategoryTreeSerializer,
    CategoryCreateUpdateSerializer
)
from .default_icons import DEFAULT_CATEGORY_ICONS, ICON_CHOICES
from core.viewset import BaseStoreViewSet
from core.permissions import IsStoreOwner
from rest_framework.permissions import AllowAny, IsAuthenticated


class CategoryViewSet(BaseStoreViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsStoreOwner]
    pagination_class = None  # برای dropdownها و درخت دسته‌ها - همه آیتم‌ها لازم است
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = CategoryFilter
    search_fields = ['name', 'slug']

    def get_permissions(self):
        if self.action in ["retrieve", "list", "tree", "icon_choices"]:
            return [AllowAny()]
        return [IsStoreOwner()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CategoryCreateUpdateSerializer
        elif self.action == 'tree':
            return CategoryTreeSerializer
        return super().get_serializer_class()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Add children count to each category
        # children_count should reflect only this store's categories
        if hasattr(request, 'store'):
            queryset = queryset.annotate(
                children_count=Count('children', filter=Q(children__store=request.store))
            )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='icons')
    def icon_choices(self, request):
        """Return list of available default icons for category selection."""
        return Response([{"value": k, "label": v} for k, v in ICON_CHOICES])

    @action(detail=False, methods=['get'])
    def tree(self, request):
        # Use store-scoped queryset to ensure only current store categories are shown
        root_categories = self.get_queryset().filter(parent__isnull=True)
        serializer = self.get_serializer(root_categories, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        category = self.get_object()
        new_parent_id = request.data.get('parent_id')
        
        if new_parent_id is None:
            category.parent = None
            category.save()
            return Response(
                self.get_serializer(category).data
            )
            
        try:
            new_parent = Category.objects.get(id=new_parent_id)
            if new_parent == category:
                return Response(
                    {'detail': 'Category cannot be parent of itself'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            category.parent = new_parent
            category.save()
            return Response(
                self.get_serializer(category).data
            )
        except Category.DoesNotExist:
            return Response(
                {'detail': 'Parent category not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            CategorySerializer(serializer.instance, context=self.get_serializer_context()).data,
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
            CategorySerializer(instance, context=self.get_serializer_context()).data
        )


def category_icon_view(request, icon_name):
    """
    Serve default category icons as SVG content.
    Supports ?color= hex for icon color (replaces currentColor).
    
    Args:
        request: HTTP request object
        icon_name: Name of the icon to serve
        
    Returns:
        HttpResponse with SVG content and appropriate headers
    """
    svg_content = DEFAULT_CATEGORY_ICONS.get(icon_name)
    
    if svg_content is None:
        return HttpResponse("Icon not found", status=404)
    
    color = request.GET.get("color", "").strip()
    if color and color.startswith("#") and len(color) in (4, 7):
        svg_content = svg_content.replace('fill="currentColor"', f'fill="{color}"')
    
    response = HttpResponse(svg_content, content_type='image/svg+xml')
    response['Cache-Control'] = 'public, max-age=31536000'
    return response