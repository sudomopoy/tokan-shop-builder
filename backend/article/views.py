from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from .models import Article
from .serializers import ArticleSerializer
from rest_framework.response import Response
from .pagination import ArticlePagination
from django_filters.rest_framework import DjangoFilterBackend
from django.conf import settings
from django.core.cache import cache
from .filters import ArticleFilter
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from core.viewset import BaseStoreViewSet
from core.permissions import IsStoreCustomer, HasBlogPermission
import logging
import uuid
import hashlib
from urllib.parse import urlencode
from rest_framework.exceptions import PermissionDenied
from core.i18n import get_deploy_locale

class ArticleViewSet(BaseStoreViewSet):
    queryset = Article.objects.all().order_by('created_at')
    serializer_class = ArticleSerializer
    lookup_field = 'slug'
    lookup_url_kwarg = 'slug'
    pagination_class = ArticlePagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = ArticleFilter
    search_fields = ['title']

    def get_permissions(self):
        if self.action == "list":
            statuses = self.request.query_params.getlist("status")
            # Public listing: allow anyone, but only "public" articles are accessible without dashboard permission.
            if statuses and set(statuses) != {"public"}:
                return [HasBlogPermission()]
            return [AllowAny()]
        if self.action == "retrieve":
            return [AllowAny()]
        return [HasBlogPermission()]

    def _build_list_cache_key(self, request) -> str:
        store = getattr(request, "store", None)
        store_key = str(getattr(store, "pk", "no_store"))
        locale = get_deploy_locale()

        pairs: list[tuple[str, str]] = []
        for key in sorted(request.query_params.keys()):
            for value in request.query_params.getlist(key):
                pairs.append((key, value))
        query_string = urlencode(pairs, doseq=True)
        digest = hashlib.sha256(query_string.encode("utf-8")).hexdigest()
        return f"articles_{store_key}_{locale}_{digest}"

    @swagger_auto_schema(
        manual_parameters=[
               openapi.Parameter(
                'status', 
                openapi.IN_QUERY, 
                description="List status(s) of Articles", 
                type=openapi.TYPE_ARRAY, 
                items=openapi.Items(type=openapi.TYPE_STRING) ,
                collectionFormat='multi' 
            ),
            openapi.Parameter(
                'categories', 
                openapi.IN_QUERY, 
                description="List of category IDs", 
                type=openapi.TYPE_ARRAY, 
                items=openapi.Items(type=openapi.TYPE_INTEGER) ,
                collectionFormat='multi' 
            ),
            openapi.Parameter(
                'tags', 
                openapi.IN_QUERY, 
                description="List of tag IDs", 
                type=openapi.TYPE_ARRAY, 
                items=openapi.Items(type=openapi.TYPE_INTEGER) ,
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
    # def create(self, request, *args, **kwargs):
    #     blank_article = Article.objects.create(
    #         module=request.body.module,
    #         slug=f'blank-{uuid.uuid4().hex}')
    #     serializer = self.get_serializer(blank_article)
    #     return Response(serializer.data)
    
    def list(self, request, *args, **kwargs):
        cache_key = self._build_list_cache_key(request)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            cache.set(cache_key, response.data, settings.CACHE_TTL)
            return response

        serializer = self.get_serializer(queryset, many=True)
        cache.set(cache_key, serializer.data, settings.CACHE_TTL)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != "public":
            perm = HasBlogPermission()
            if not perm.has_permission(request, self) or not perm.has_object_permission(
                request, self, instance
            ):
                raise PermissionDenied()

        article_id = str(instance.pk)

        try:
            Article.track_view(article_id)
        except Exception as e:
            logging.error(str(e))

        cache_key = f'article_{get_deploy_locale()}_{article_id}'
        cached_article = cache.get(cache_key)
        if cached_article:
            return Response(cached_article)

        serializer = self.get_serializer(instance)
        cache.set(cache_key, serializer.data, settings.CACHE_TTL)
        return Response(serializer.data)

    def filter_queryset(self, queryset): 
        statuses = self.request.query_params.getlist("status")
        # Public listing defaults to public-only unless a status filter is explicitly provided.
        if not statuses:
            queryset = queryset.filter(status="public")

        return super().filter_queryset(queryset)
