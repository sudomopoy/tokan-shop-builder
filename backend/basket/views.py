from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.permissions import IsStoreCustomer
from core.viewset import BaseStoreViewSet
from product.pricing import calculate_line_pricing

from .models import Basket, BasketItem
from .serializers import BasketItemSerializer, BasketSerializer


class BasketViewSet(BaseStoreViewSet):
    serializer_class = BasketSerializer
    permission_classes = [IsStoreCustomer]
    pagination_class = None

    def get_queryset(self):
        return (
            Basket.objects.filter(store_user=self.request.store_user)
            .select_related("store", "store_user")
            .prefetch_related(
                "items",
                "items__product",
                "items__product__allowed_customer_groups",
                "items__variant",
            )
        )

    def _validate_item_quantity(self, item, quantity):
        try:
            parsed_quantity = int(quantity)
        except (TypeError, ValueError):
            raise ValidationError({"quantity": "Quantity must be a valid integer."})

        if parsed_quantity < 1:
            raise ValidationError({"quantity": "Quantity must be at least 1."})

        try:
            calculate_line_pricing(
                product=item.product,
                variant=item.variant,
                quantity=parsed_quantity,
                store_user=self.request.store_user,
            )
        except PermissionError as exc:
            raise ValidationError({"product": str(exc)})
        except ValueError as exc:
            raise ValidationError({"quantity": str(exc)})

        stock_target = item.variant or item.product
        if not getattr(stock_target, "stock_unlimited", False):
            available = stock_target.stock or 0
            if parsed_quantity > available:
                raise ValidationError({"quantity": "Insufficient stock."})

        return parsed_quantity

    def list(self, request, *args, **kwargs):
        basket, _ = Basket.objects.get_or_create(store=request.store, store_user=request.store_user)
        serializer = self.get_serializer(basket)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="add")
    def add_item(self, request):
        basket, _ = Basket.objects.get_or_create(store=request.store, store_user=request.store_user)

        serializer = BasketItemSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data["product"]
        variant = serializer.validated_data.get("variant")
        quantity = serializer.validated_data["quantity"]

        item, created = BasketItem.objects.get_or_create(
            basket=basket,
            product=product,
            variant=variant,
            defaults={"store": request.store, "quantity": 0},
        )

        new_quantity = quantity if created else (item.quantity + quantity)
        item.quantity = self._validate_item_quantity(item, new_quantity)
        item.save(update_fields=["quantity", "updated_at"])

        return Response(self.get_serializer(basket).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="remove")
    def remove_item(self, request):
        item_id = request.data.get("item_id")
        if not item_id:
            return Response({"error": "item_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        basket = get_object_or_404(Basket, store=request.store, store_user=request.store_user)
        item = get_object_or_404(BasketItem, basket=basket, id=item_id)
        item.delete()

        return Response(self.get_serializer(basket).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="update")
    def update_item(self, request):
        item_id = request.data.get("item_id")
        quantity = request.data.get("quantity")

        if not item_id or quantity is None:
            return Response(
                {"error": "item_id and quantity are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        basket = get_object_or_404(Basket, store=request.store, store_user=request.store_user)
        item = get_object_or_404(BasketItem, basket=basket, id=item_id)

        try:
            parsed_quantity = int(quantity)
        except (TypeError, ValueError):
            return Response({"error": "quantity must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        if parsed_quantity <= 0:
            item.delete()
        else:
            item.quantity = self._validate_item_quantity(item, parsed_quantity)
            item.save(update_fields=["quantity", "updated_at"])

        return Response(self.get_serializer(basket).data, status=status.HTTP_200_OK)
