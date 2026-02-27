from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Tag
from .serializers import TagSerializer
from django.core.cache import cache
from django.conf import settings
from core.viewset import BaseStoreViewSet
from core.permissions import IsStoreOwner


class TagViewSet(BaseStoreViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsStoreOwner]
    pagination_class = None  # برای dropdown تگ‌ها در بلاگ

    def get_permissions(self):
        if self.action in ["retrieve", "list"]:
            return [AllowAny()]
        return [IsStoreOwner()]

    def list(self, request, *args, **kwargs):
        filter_params = request.query_params
        cache_key = f'tags_{hash(frozenset(filter_params.items()))}'
        cached_Tags = cache.get(cache_key)

        if cached_Tags:
            return Response(cached_Tags)

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            cache.set(cache_key, serializer.data, settings.CACHE_TTL)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        cache.set(cache_key, serializer.data, settings.CACHE_TTL)
        return Response(serializer.data)