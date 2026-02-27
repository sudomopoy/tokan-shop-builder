from rest_framework import serializers
from .models import Basket, BasketItem
from product.serializers import ProductSerializer, VariantSerializer


class BasketItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source="product", read_only=True)
    variant_details = VariantSerializer(source="variant", read_only=True)
    total_price = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    unit_price = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)

    class Meta:
        model = BasketItem
        fields = [
            "id",
            "product",
            "variant",
            "quantity",
            "product_details",
            "variant_details",
            "unit_price",
            "total_price",
        ]
        read_only_fields = ["id", "product_details", "variant_details", "unit_price", "total_price"]

    def validate(self, data):
        # بررسی موجودی انبار هنگام افزودن/ویرایش
        product = data.get("product") or self.instance.product
        variant = data.get("variant") or (self.instance.variant if self.instance else None)
        quantity = data.get("quantity")

        if variant and getattr(variant, "stock_unlimited", False):
            pass  # unlimited, no check
        elif product and getattr(product, "stock_unlimited", False):
            pass  # unlimited, no check
        else:
            stock = variant.stock if variant else (product.stock or 0)
            if quantity > stock:
                raise serializers.ValidationError("موجودی کافی نیست.")

        return data


class BasketSerializer(serializers.ModelSerializer):
    items = BasketItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    total_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = Basket
        fields = ["id", "store", "store_user", "items", "total_price", "total_items", "created_at", "updated_at"]
        read_only_fields = ["id", "store", "store_user", "items", "total_price", "total_items", "created_at", "updated_at"]
