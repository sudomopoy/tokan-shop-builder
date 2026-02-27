from rest_framework import serializers
from .models import Order, OrderItem, ShippingMethod, ShippingMethodDefinition
from product.serializers import OrderItemVariantSerializer, OrderItemProductSerializer
from product.models import Variant, Product
from decimal import Decimal
from media.serializers import MediaSerializer
from account.models import Address
from meta.serializers import ProvinceSerializer, CitySerializer


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
            "id", "recipient_fullname", "phone_number", "address_line1",
            "postcode", "province", "city",
        ]


class ShippingMethodSerializer(serializers.ModelSerializer):
    logo = MediaSerializer(read_only=True, allow_null=True)
    definition = ShippingMethodDefinitionSerializer(read_only=True)

    class Meta:
        model = ShippingMethod
        fields = "__all__"


class ShippingMethodUpdateSerializer(serializers.ModelSerializer):
    """For PATCH: store can update name, description, prices, is_active, etc."""

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
    """For POST: store adds a custom shipping method (no definition)."""

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
            raise serializers.ValidationError("فروشگاه مشخص نیست.")
        validated_data["store"] = request.store
        validated_data["definition"] = None  # custom method
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
            "id", "variant", "variant_id", "product", "product_id",
            "quantity", "unit_price", "custom_input_values",
        ]
        read_only_fields = ["unit_price"]


class OrderStoreUserSerializer(serializers.Serializer):
    """Minimal customer info for order list (store admin view)."""
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
            "payable_amount",
            "delivery_amount",
            "shipping_tracking_code",
            "shipping_tracking_url",
            "created_at",
            "updated_at",
        ]

    def validate(self, data):
        items = data.get("items", [])
        if not items:
            raise serializers.ValidationError("Order must have at least one item")

        # Calculate total amount and validate variants; detect if any physical product
        products_total_amount = Decimal("0")
        has_physical = False
        for item in items:
            product_id = item.get("product_id")
            variant_id = item.get("variant_id", None)
            quantity = item.get("quantity", 0)
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    f"Product {product_id} does not exist"
                )
            if not product.is_digital:
                has_physical = True
            if variant_id:
                try:
                    variant = Variant.objects.get(id=variant_id)
                    if variant.product.id != product.id:
                        raise serializers.ValidationError(
                            f"Product and variant most be same {variant_id}"
                        )
                    if not getattr(variant, "stock_unlimited", False) and variant.stock < quantity:
                        raise serializers.ValidationError(
                            f"Insufficient stock for variant {variant_id}"
                        )
                    item["unit_price"] = variant.sell_price
                    products_total_amount += variant.sell_price * quantity
                except Variant.DoesNotExist:
                    raise serializers.ValidationError(
                        f"Product variant {variant_id} does not exist"
                    )
            else:
                if product.main_variant or Variant.objects.filter(product__id=product.pk).exists():
                    raise serializers.ValidationError('Product with variant most order with variant')
                if not getattr(product, "stock_unlimited", False) and (product.stock or 0) < quantity:
                    raise serializers.ValidationError(f"Insufficient stock for product {product_id}")
                item["unit_price"] = product.sell_price
                products_total_amount += product.sell_price * quantity

        shipping_method = data.get("shipping_method")
        delivery_address = data.get("delivery_address")

        if has_physical:
            if not shipping_method:
                raise serializers.ValidationError({"shipping_method": "برای محصولات فیزیکی روش ارسال الزامی است."})
            if not delivery_address:
                raise serializers.ValidationError({"delivery_address": "برای محصولات فیزیکی آدرس تحویل الزامی است."})
            data["delivery_amount"] = shipping_method.base_shipping_price
            data["payable_amount"] = products_total_amount + shipping_method.base_shipping_price
        else:
            # Digital-only order: no shipping
            data["shipping_method"] = None
            data["delivery_address"] = None
            data["delivery_amount"] = Decimal("0")
            data["payable_amount"] = products_total_amount

        data["products_total_amount"] = products_total_amount
        return data

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            variant_id = item_data.pop("variant_id", None)
            product_id = item_data.pop("product_id")
            custom_input_values = item_data.pop("custom_input_values", {})
            OrderItem.objects.create(
                order=order,
                product_id=product_id,
                variant_id=variant_id,
                custom_input_values=custom_input_values or {},
                **item_data,
            )

        return order


class OrderDetailSerializer(OrderSerializer):
    """Expanded serializer for order retrieve - includes nested shipping_method and delivery_address."""
    shipping_method = ShippingMethodSerializer(read_only=True)
    delivery_address = OrderAddressSerializer(read_only=True)


class OrderStoreUpdateSerializer(serializers.ModelSerializer):
    """For store admin to update order status and tracking code."""
    class Meta:
        model = Order
        fields = ("status", "shipping_tracking_code")

    def validate_status(self, value):
        valid = {"pending", "paid", "processing", "completed", "delivered", "cancelled", "failed"}
        if value not in valid:
            raise serializers.ValidationError(f"وضعیت نامعتبر: {value}")
        return value
