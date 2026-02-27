from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.permissions import IsStoreOwner, IsStoreOwnerOnly
from core.viewset import BaseStoreViewSet
from .models import Menu, MenuItem
from .serializers import (
    MenuSerializer,
    MenuDetailSerializer,
    MenuItemSerializer,
    MenuItemTreeSerializer,
)


class MenuViewSet(BaseStoreViewSet):
    queryset = Menu.objects.all()
    serializer_class = MenuSerializer
    permission_classes = [IsStoreOwner]
    pagination_class = None  # برای dropdown منوها

    def get_permissions(self):
        if self.action in ["main", "by_key"]:
            return [AllowAny()]
        if self.action in ["list", "retrieve"]:
            include_inactive = self.request.query_params.get("include_inactive") == "1"
            if include_inactive:
                return [IsStoreOwnerOnly()]  # داشبورد: فقط مالک
            return [AllowAny()]
        return [IsStoreOwnerOnly()]  # create, update, delete: فقط مالک

    def get_serializer_class(self):
        if self.action in ["retrieve", "main", "by_key"]:
            return MenuDetailSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        queryset = super().get_queryset().select_related("store")
        if self.action in ["list", "retrieve", "main", "by_key"]:
            # Store owners can see all menus when include_inactive=1 (for dashboard)
            include_inactive = self.request.query_params.get("include_inactive") == "1"
            if include_inactive and self._is_store_owner():
                pass  # no is_active filter
            else:
                queryset = queryset.filter(is_active=True)

        key = self.request.query_params.get("key")
        if key:
            queryset = queryset.filter(key=key)

        return queryset

    def _is_store_owner(self):
        if not self.request.user.is_authenticated or not hasattr(self.request, "store"):
            return False
        from account.models import StoreUser
        return StoreUser.objects.filter(
            store=self.request.store,
            user=self.request.user,
            level__gte=1,
        ).exists()

    @action(detail=False, methods=["get"])
    def main(self, request):
        menu = self.get_queryset().filter(is_primary=True).first()
        if not menu:
            return Response({"detail": "Main menu not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(menu)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_key(self, request):
        key = request.query_params.get("key")
        if not key:
            return Response(
                {"detail": "key query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        menu = self.get_queryset().filter(key=key).first()
        if not menu:
            return Response({"detail": "Menu not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(menu)
        return Response(serializer.data)


class MenuItemViewSet(BaseStoreViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsStoreOwner]
    pagination_class = None  # برای dropdown آیتم‌های منو

    def get_permissions(self):
        if self.action in ["list", "retrieve", "tree"]:
            return [AllowAny()]
        return [IsStoreOwner()]

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            "menu", "parent", "category", "product", "page"
        )
        menu_id = self.request.query_params.get("menu")
        if menu_id:
            queryset = queryset.filter(menu_id=menu_id)

        parent_id = self.request.query_params.get("parent")
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)

        status_param = self.request.query_params.get("status")
        if status_param:
            statuses = [value.strip() for value in status_param.split(",") if value.strip()]
            if statuses:
                queryset = queryset.filter(status__in=statuses)

        return queryset.order_by("index")

    @action(detail=False, methods=["get"])
    def tree(self, request):
        menu_id = request.query_params.get("menu")
        if not menu_id:
            return Response(
                {"detail": "menu query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset().filter(menu_id=menu_id, parent__isnull=True)
        serializer = MenuItemTreeSerializer(
            queryset, many=True, context=self.get_serializer_context()
        )
        return Response(serializer.data)
