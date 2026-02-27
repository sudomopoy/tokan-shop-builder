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
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [HasBlogPermission()]

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
        filter_params = request.query_params
        cache_key = f'articles_{hash(frozenset(filter_params.items()))}'
        cached_articles = cache.get(cache_key)

        if cached_articles:
            return Response(cached_articles)

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            cache.set(cache_key, serializer.data, settings.CACHE_TTL)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        cache.set(cache_key, serializer.data, settings.CACHE_TTL)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        article_id = str(instance.pk)

        try:
            Article.track_view(article_id)
        except Exception as e:
            logging.error(str(e))

        cache_key = f'article_{article_id}'
        cached_article = cache.get(cache_key)
        if cached_article:
            return Response(cached_article)

        serializer = self.get_serializer(instance)
        cache.set(cache_key, serializer.data, settings.CACHE_TTL)
        return Response(serializer.data)

    def filter_queryset(self, queryset): 
        if 'status' not in self.request.query_params:
            queryset = queryset.filter(status='public') 

        return super().filter_queryset(queryset)