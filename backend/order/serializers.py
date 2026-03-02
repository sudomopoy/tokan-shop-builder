from decimal import Decimal

from rest_framework import serializers

from account.models import Address
from media.serializers import MediaSerializer
from meta.serializers import CitySerializer, ProvinceSerializer
from product.models import Product, Variant
from product.pricing import calculate_cart_pricing, calculate_line_pricing
from product.serializers import OrderItemProductSerializer, OrderItemVariantSerializer

from .models import Order, OrderItem, ShippingMethod, ShippingMethodDefinition


class ShippingMethodDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingMethodDefinition
        fields = ("id", "slug", "name", "description")


class OrderAddressSerializer(serializers.ModelSerializer):
    province = ProvinceSerializer(read_only=True)
    city = CitySerializer(read_only=True)

    class Meta:
        model = Address
        fields = [
            "id",
            "recipient_fullname",
            "phone_number",
            "address_line1",
            "postcode",
            "province",
            "city",
        ]


class ShippingMethodSerializer(serializers.ModelSerializer):
    logo = MediaSerializer(read_only=True, allow_null=True)
    definition = ShippingMethodDefinitionSerializer(read_only=True)

    class Meta:
        model = ShippingMethod
        fields = "__all__"


class ShippingMethodUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingMethod
        fields = (
            "name",
            "description",
            "logo",
            "shipping_payment_on_delivery",
            "product_payment_on_delivery",
            "max_payment_on_delivery",
            "base_shipping_price",
            "shipping_price_per_extra_kilograms",
            "tracking_code_base_url",
            "is_active",
        )


class ShippingMethodCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingMethod
        fields = (
            "name",
            "description",
            "logo",
            "base_shipping_price",
            "shipping_price_per_extra_kilograms",
            "tracking_code_base_url",
            "shipping_payment_on_delivery",
            "product_payment_on_delivery",
            "max_payment_on_delivery",
            "is_active",
        )

    def create(self, validated_data):
        request = self.context.get("request")
        if not request or not getattr(request, "store", None):
            raise serializers.ValidationError("Store is not resolved.")
        validated_data["store"] = request.store
        validated_data["definition"] = None
        return super().create(validated_data)


class OrderItemSerializer(serializers.ModelSerializer):
    variant = OrderItemVariantSerializer(read_only=True)
    variant_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    product = OrderItemProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    custom_input_values = serializers.JSONField(required=False, default=dict)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "variant",
            "variant_id",
            "product",
            "product_id",
            "quantity",
            "unit_price",
            "custom_input_values",
        ]
        read_only_fields = ["unit_price"]


class OrderStoreUserSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    display_name = serializers.CharField(read_only=True)
    user_mobile = serializers.SerializerMethodField()

    def get_user_mobile(self, obj):
        if not obj:
            return ""
        user = getattr(obj, "user", None)
        return getattr(user, "mobile", "") if user else ""


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=True)
    store_user = OrderStoreUserSerializer(read_only=True, allow_null=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "code",
            "is_payed",
            "products_total_amount",
            "cart_discount_percent",
            "cart_discount_amount",
            "payable_amount",
            "delivery_amount",
            "status",
            "shipping_tracking_code",
            "shipping_tracking_url",
            "shipping_method",
            "delivery_address",
            "store_user",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "code",
            "status",
            "products_total_amount",
            "cart_discount_percent",
            "cart_discount_amount",
            "payable_amount",
            "delivery_amount",
            "shipping_tracking_code",
            "shipping_tracking_url",
            "created_at",
            "updated_at",
        ]

    def validate(self, data):
        request = self.context.get("request")
        store = getattr(request, "store", None) if request else None
        store_user = getattr(request, "store_user", None) if request else None

        items = data.get("items", [])
        if not items:
            raise serializers.ValidationError("Order must have at least one item.")

        has_physical = False
        line_pricings = []

        for item in items:
            product_id = item.get("product_id")
            variant_id = item.get("variant_id")
            quantity = int(item.get("quantity") or 0)

            if quantity < 1:
                raise serializers.ValidationError({"items": "Quantity must be at least 1."})

            product_qs = Product.objects.filter(id=product_id)
            if store:
                product_qs = product_qs.filter(store=store)
            product = product_qs.first()
            if not product:
                raise serializers.ValidationError(f"Product {product_id} does not exist in this store.")

            if not product.is_active:
                raise serializers.ValidationError(f"Product {product_id} is not active.")

            variant = None
            if variant_id:
                variant = Variant.objects.filter(id=variant_id, product=product).first()
                if not variant:
                    raise serializers.ValidationError(
                        f"Product variant {variant_id} does not exist for this product."
                    )
            else:
                if not product.is_wholesale_mode and product.variants.exists():
                    raise serializers.ValidationError(
                        "Products with variants must be ordered using a variant_id."
                    )

            try:
                line_pricing = calculate_line_pricing(
                    product=product,
                    variant=variant,
                    quantity=quantity,
                    store_user=store_user,
                )
            except PermissionError as exc:
                raise serializers.ValidationError({"items": str(exc)})
            except ValueError as exc:
                raise serializers.ValidationError({"items": str(exc)})

            stock_target = variant or product
            if not getattr(stock_target, "stock_unlimited", False):
                available = stock_target.stock or 0
                if quantity > available:
                    raise serializers.ValidationError(
                        {"items": f"Insufficient stock for product {product_id}."}
                    )

            item["unit_price"] = line_pricing.unit_price
            line_pricings.append(line_pricing)
            if not product.is_digital:
                has_physical = True

        if not store:
            raise serializers.ValidationError("Store context is required.")

        cart_pricing = calculate_cart_pricing(
            store=store,
            lines=line_pricings,
            store_user=store_user,
        )

        products_total_amount = cart_pricing.total
        data["products_total_amount"] = products_total_amount
        data["cart_discount_percent"] = cart_pricing.cart_discount_percent
        data["cart_discount_amount"] = cart_pricing.cart_discount_amount

        shipping_method = data.get("shipping_method")
        delivery_address = data.get("delivery_address")

        if has_physical:
            if not shipping_method:
                raise serializers.ValidationError(
                    {"shipping_method": "Shipping method is required for physical products."}
                )
            if shipping_method.store_id != store.id:
                raise serializers.ValidationError({"shipping_method": "Invalid shipping method."})
            if not shipping_method.is_active:
                raise serializers.ValidationError({"shipping_method": "Selected shipping method is inactive."})

            if not delivery_address:
                raise serializers.ValidationError(
                    {"delivery_address": "Delivery address is required for physical products."}
                )
            if store_user and delivery_address.store_user_id != store_user.id:
                raise serializers.ValidationError({"delivery_address": "Invalid delivery address."})

            data["delivery_amount"] = shipping_method.base_shipping_price
            data["payable_amount"] = products_total_amount + shipping_method.base_shipping_price
        else:
            data["shipping_method"] = None
            data["delivery_address"] = None
            data["delivery_amount"] = Decimal("0")
            data["payable_amount"] = products_total_amount

        return data

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            variant_id = item_data.pop("variant_id", None)
            product_id = item_data.pop("product_id")
            custom_input_values = item_data.pop("custom_input_values", {})
            OrderItem.objects.create(
                store=order.store,
                order=order,
                product_id=product_id,
                variant_id=variant_id,
                custom_input_values=custom_input_values or {},
                **item_data,
            )

        return order


class OrderDetailSerializer(OrderSerializer):
    shipping_method = ShippingMethodSerializer(read_only=True)
    delivery_address = OrderAddressSerializer(read_only=True)


class OrderStoreUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("status", "shipping_tracking_code")

    def validate_status(self, value):
        valid = {"pending", "paid", "processing", "completed", "delivered", "cancelled", "failed"}
        if value not in valid:
            raise serializers.ValidationError(f"Invalid status: {value}")
        return value
