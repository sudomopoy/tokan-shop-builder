from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from core.viewset import BaseStoreViewSet
from core.permissions import IsStoreCustomer
from .models import Basket, BasketItem
from .serializers import BasketSerializer, BasketItemSerializer


class BasketViewSet(BaseStoreViewSet):
    serializer_class = BasketSerializer
    permission_classes = [IsStoreCustomer]
    pagination_class = None  # سبد خرید معمولاً یک آبجکت است و نیاز به صفحه‌بندی ندارد

    def get_queryset(self):
        return Basket.objects.filter(store_user=self.request.store_user).prefetch_related(
            "items", "items__product", "items__variant"
        )

    def list(self, request, *args, **kwargs):
        # همیشه سبد خرید فعلی کاربر را برمی‌گرداند (یا می‌سازد)
        basket, created = Basket.objects.get_or_create(
            store=request.store,
            store_user=request.store_user
        )
        serializer = self.get_serializer(basket)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="add")
    def add_item(self, request):
        """
        افزودن آیتم به سبد خرید
        """
        basket, created = Basket.objects.get_or_create(
            store=request.store,
            store_user=request.store_user
        )
        
        serializer = BasketItemSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        
        product = serializer.validated_data["product"]
        variant = serializer.validated_data.get("variant")
        quantity = serializer.validated_data["quantity"]

        # اگر آیتم در سبد باشد، تعدادش اضافه شود
        item, item_created = BasketItem.objects.get_or_create(
            basket=basket,
            product=product,
            variant=variant,
            defaults={"quantity": 0}
        )
        
        if not item_created:
            item.quantity += quantity
        else:
            item.quantity = quantity
            
        # چک کردن مجدد موجودی (چون ممکن است جمع تعداد قبلی و فعلی از موجودی بیشتر شود)
        obj = variant or product
        if not getattr(obj, "stock_unlimited", False):
            stock = variant.stock if variant else (product.stock or 0)
            if item.quantity > stock:
                return Response(
                    {"error": "موجودی کافی نیست."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        item.save()
        
        # بازگرداندن کل سبد آپدیت شده
        basket_serializer = self.get_serializer(basket)
        return Response(basket_serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="remove")
    def remove_item(self, request):
        """
        حذف آیتم از سبد خرید
        item_id: ID آیتم سبد خرید
        """
        item_id = request.data.get("item_id")
        if not item_id:
            return Response({"error": "item_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        basket = get_object_or_404(Basket, store=request.store, store_user=request.store_user)
        item = get_object_or_404(BasketItem, basket=basket, id=item_id)
        item.delete()

        basket_serializer = self.get_serializer(basket)
        return Response(basket_serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="update")
    def update_item(self, request):
        """
        آپدیت تعداد آیتم
        item_id: ID آیتم
        quantity: تعداد جدید
        """
        item_id = request.data.get("item_id")
        quantity = request.data.get("quantity")
        
        if not item_id or quantity is None:
            return Response({"error": "item_id and quantity are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        basket = get_object_or_404(Basket, store=request.store, store_user=request.store_user)
        item = get_object_or_404(BasketItem, basket=basket, id=item_id)
        
        if int(quantity) <= 0:
            item.delete()
        else:
            # چک کردن موجودی
            obj = item.variant or item.product
            if not getattr(obj, "stock_unlimited", False):
                stock = item.variant.stock if item.variant else (item.product.stock or 0)
                if int(quantity) > stock:
                    return Response(
                        {"error": "موجودی کافی نیست."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            item.quantity = int(quantity)
            item.save()

        basket_serializer = self.get_serializer(basket)
        return Response(basket_serializer.data, status=status.HTTP_200_OK)
