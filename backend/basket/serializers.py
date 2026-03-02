from rest_framework import serializers

from product.pricing import (
    calculate_cart_pricing,
    calculate_line_pricing,
    product_is_accessible_to_store_user,
    validate_purchase_quantity,
)
from product.serializers import ProductSerializer, VariantSerializer

from .models import Basket, BasketItem


class BasketItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source="product", read_only=True)
    variant_details = VariantSerializer(source="variant", read_only=True)
    unit_price = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    line_subtotal = serializers.SerializerMethodField()
    line_discount_amount = serializers.SerializerMethodField()
    quantity_discount_percent = serializers.SerializerMethodField()
    applied_group_price_id = serializers.SerializerMethodField()

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
            "line_subtotal",
            "line_discount_amount",
            "quantity_discount_percent",
            "applied_group_price_id",
            "total_price",
        ]
        read_only_fields = [
            "id",
            "product_details",
            "variant_details",
            "unit_price",
            "line_subtotal",
            "line_discount_amount",
            "quantity_discount_percent",
            "applied_group_price_id",
            "total_price",
        ]

    def _get_line_pricing(self, obj):
        line_map = self.context.get("line_pricing_map", {})
        return line_map.get(str(obj.id))

    def get_unit_price(self, obj):
        line = self._get_line_pricing(obj)
        if line:
            return str(line.unit_price)
        return str(obj.unit_price)

    def get_line_subtotal(self, obj):
        line = self._get_line_pricing(obj)
        if line:
            return str(line.line_subtotal)
        return str(obj.total_price)

    def get_line_discount_amount(self, obj):
        line = self._get_line_pricing(obj)
        if line:
            return str(line.line_discount_amount)
        return "0.00"

    def get_quantity_discount_percent(self, obj):
        line = self._get_line_pricing(obj)
        if line:
            return str(line.quantity_discount_percent)
        return "0"

    def get_applied_group_price_id(self, obj):
        line = self._get_line_pricing(obj)
        if line:
            return line.applied_group_price_id
        return None

    def get_total_price(self, obj):
        line = self._get_line_pricing(obj)
        if line:
            return str(line.line_total)
        return str(obj.total_price)

    def validate(self, data):
        request = self.context.get("request")
        product = data.get("product") or (self.instance.product if self.instance else None)
        variant = data.get("variant") if "variant" in data else (self.instance.variant if self.instance else None)
        quantity = data.get("quantity") or (self.instance.quantity if self.instance else None)

        if not product:
            raise serializers.ValidationError({"product": "Product is required."})
        if not quantity:
            raise serializers.ValidationError({"quantity": "Quantity is required."})

        if request and hasattr(request, "store") and product.store_id != request.store.id:
            raise serializers.ValidationError({"product": "Product does not belong to the active store."})

        if variant:
            if variant.product_id != product.id:
                raise serializers.ValidationError({"variant": "Variant does not belong to selected product."})
            if request and hasattr(request, "store") and variant.store_id != request.store.id:
                raise serializers.ValidationError({"variant": "Variant does not belong to the active store."})

        store_user = getattr(request, "store_user", None) if request else None
        if not product_is_accessible_to_store_user(product, store_user):
            raise serializers.ValidationError({"product": "You do not have access to this product."})

        try:
            validate_purchase_quantity(product=product, quantity=int(quantity), variant=variant)
        except ValueError as exc:
            raise serializers.ValidationError({"quantity": str(exc)})

        stock_target = variant or product
        if not getattr(stock_target, "stock_unlimited", False):
            available = stock_target.stock or 0
            if int(quantity) > available:
                raise serializers.ValidationError({"quantity": "Insufficient stock."})

        return data


class BasketSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    cart_discount_percent = serializers.SerializerMethodField()
    cart_discount_amount = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Basket
        fields = [
            "id",
            "store",
            "store_user",
            "items",
            "subtotal",
            "cart_discount_percent",
            "cart_discount_amount",
            "total_price",
            "total_items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "store",
            "store_user",
            "items",
            "subtotal",
            "cart_discount_percent",
            "cart_discount_amount",
            "total_price",
            "total_items",
            "created_at",
            "updated_at",
        ]

    def _get_pricing_state(self, obj):
        cache = getattr(self, "_pricing_state_cache", None)
        if cache is None:
            cache = {}
            self._pricing_state_cache = cache

        cache_key = str(obj.id)
        if cache_key in cache:
            return cache[cache_key]

        line_map = {}
        lines = []
        for item in obj.items.all():
            try:
                line = calculate_line_pricing(
                    product=item.product,
                    variant=item.variant,
                    quantity=item.quantity,
                    store_user=obj.store_user,
                )
            except (PermissionError, ValueError) as exc:
                raise serializers.ValidationError({"items": f"Item {item.id}: {str(exc)}"})
            line_map[str(item.id)] = line
            lines.append(line)

        cart_pricing = calculate_cart_pricing(
            store=obj.store,
            lines=lines,
            store_user=obj.store_user,
        )
        state = {"lines": line_map, "cart": cart_pricing}
        cache[cache_key] = state
        return state

    def get_items(self, obj):
        state = self._get_pricing_state(obj)
        context = dict(self.context)
        context["line_pricing_map"] = state["lines"]
        return BasketItemSerializer(obj.items.all(), many=True, context=context).data

    def get_subtotal(self, obj):
        state = self._get_pricing_state(obj)
        return str(state["cart"].subtotal)

    def get_cart_discount_percent(self, obj):
        state = self._get_pricing_state(obj)
        return str(state["cart"].cart_discount_percent)

    def get_cart_discount_amount(self, obj):
        state = self._get_pricing_state(obj)
        return str(state["cart"].cart_discount_amount)

    def get_total_price(self, obj):
        state = self._get_pricing_state(obj)
        return str(state["cart"].total)

    def get_total_items(self, obj):
        state = self._get_pricing_state(obj)
        return state["cart"].total_quantity
