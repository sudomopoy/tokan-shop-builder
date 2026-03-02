# serializers.py
from rest_framework import serializers
from .models import (
    Product,
    Variant,
    VariantAttribute,
    VariantAttributeValue,
    VariantAttributeSelection,
    ProductGroupPrice,
    ProductTierDiscount,
    StoreCartTierDiscount,
    InventoryAdjustmentLog,
)
from media.serializers import MediaSerializer
from category.serializers import CategorySerializer
from tag.serializers import TagSerializer
from media.models import Media
from django.shortcuts import get_object_or_404
from category.models import Category
from account.models import CustomerGroup, StoreUser
from store.serializers import StorePublicSerializer
from product.pricing import (
    resolve_group_specific_price,
)


class VariantAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantAttribute
        fields = ["id", "title", "slug", "display_type", "unit", "is_system"]


class VariantAttributeValueSerializer(serializers.ModelSerializer):
    attribute = VariantAttributeSerializer(read_only=True)

    attribute_id = serializers.PrimaryKeyRelatedField(
        queryset=VariantAttribute.objects.all(),
        source="attribute",
        write_only=True,
    )

    class Meta:
        model = VariantAttributeValue
        fields = ["id", "title", "code", "sort_order", "attribute", "attribute_id"]


class IdTitleCodeSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    title = serializers.CharField()
    code = serializers.CharField()


class VariantAttributeValuePairSerializer(serializers.Serializer):
    attribute = VariantAttributeSerializer()
    value = IdTitleCodeSerializer()


class VariantSelectionInputSerializer(serializers.Serializer):
    attribute_id = serializers.UUIDField()
    value_id = serializers.UUIDField()


class VariantSerializer(serializers.ModelSerializer):
    # allow nested updates by accepting id in request payload
    id = serializers.UUIDField(required=False)
    main_image = MediaSerializer(read_only=True)
    list_images = MediaSerializer(many=True, read_only=True)

    attribute_values = serializers.SerializerMethodField()
    selections = VariantSelectionInputSerializer(many=True, write_only=True, required=False)
    
    main_image_id = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(),
        source='main_image',
        write_only=True,
        required=False,
        allow_null=True
    )
    list_images_ids = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(),
        source='list_images',
        write_only=True,
        many=True,
        required=False
    )

    class Meta:
        model = Variant
        fields = [
            "id",
            "price",
            "sell_price",
            "cooperate_price",
            "main_image",
            "list_images",
            "stock",
            "stock_unlimited",
            "main_image_id",
            "list_images_ids",
            "attribute_values",
            "selections",
        ]
        extra_kwargs = {
            'product': {'read_only': True}
        }

    def get_attribute_values(self, obj: Variant):
        results = []
        selections = VariantAttributeSelection.objects.filter(variant=obj).select_related(
            "attribute", "value"
        )
        for s in selections:
            results.append(
                {
                    "attribute": VariantAttributeSerializer(s.attribute).data,
                    "value": {
                        "id": s.value.id,
                        "title": s.value.title,
                        "code": s.value.code,
                    },
                }
            )
        return results


class CustomerGroupLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerGroup
        fields = ["id", "name", "slug"]


class ProductGroupPriceSerializer(serializers.ModelSerializer):
    customer_group = CustomerGroupLiteSerializer(read_only=True)
    customer_group_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomerGroup.objects.all(),
        source="customer_group",
        write_only=True,
    )
    variant_id = serializers.PrimaryKeyRelatedField(
        queryset=Variant.objects.all(),
        source="variant",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ProductGroupPrice
        fields = [
            "id",
            "customer_group",
            "customer_group_id",
            "variant",
            "variant_id",
            "price",
            "sell_price",
            "is_active",
        ]
        read_only_fields = ["variant"]


class ProductTierDiscountSerializer(serializers.ModelSerializer):
    customer_group = CustomerGroupLiteSerializer(read_only=True)
    customer_group_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomerGroup.objects.all(),
        source="customer_group",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ProductTierDiscount
        fields = [
            "id",
            "customer_group",
            "customer_group_id",
            "min_quantity",
            "max_quantity",
            "discount_percent",
            "is_active",
        ]


class StoreCartTierDiscountSerializer(serializers.ModelSerializer):
    customer_group = CustomerGroupLiteSerializer(read_only=True)
    customer_group_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomerGroup.objects.all(),
        source="customer_group",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = StoreCartTierDiscount
        fields = [
            "id",
            "criterion",
            "min_value",
            "max_value",
            "discount_percent",
            "customer_group",
            "customer_group_id",
            "is_active",
        ]


class InventoryAdjustmentLogSerializer(serializers.ModelSerializer):
    actor_mobile = serializers.CharField(source="actor_user.mobile", read_only=True)

    class Meta:
        model = InventoryAdjustmentLog
        fields = [
            "id",
            "product",
            "variant",
            "reason",
            "quantity_before",
            "quantity_after",
            "quantity_change",
            "note",
            "actor_store_user",
            "actor_user",
            "actor_mobile",
            "order",
            "created_at",
        ]
        read_only_fields = fields


class ProductInventoryAdjustSerializer(serializers.Serializer):
    MODE_SET = "set"
    MODE_INCREASE = "increase"
    MODE_DECREASE = "decrease"
    MODE_CHOICES = (
        (MODE_SET, "Set"),
        (MODE_INCREASE, "Increase"),
        (MODE_DECREASE, "Decrease"),
    )

    mode = serializers.ChoiceField(choices=MODE_CHOICES)
    quantity = serializers.IntegerField(min_value=0)
    note = serializers.CharField(required=False, allow_blank=True, default="")
    variant_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs):
        mode = attrs.get("mode")
        quantity = attrs.get("quantity", 0)
        if mode in (self.MODE_INCREASE, self.MODE_DECREASE) and quantity < 1:
            raise serializers.ValidationError(
                {"quantity": "Quantity must be at least 1 for increase/decrease mode."}
            )
        return attrs


def _expand_categories_with_ancestors(category_ids):
    """For each category, add all its ancestors + itself. Returns unique list root-first."""
    if not category_ids:
        return []
    seen = set()
    result = []
    for cat_id in category_ids:
        try:
            cat = Category.objects.get(id=cat_id)
        except Category.DoesNotExist:
            continue
        # Ancestors (root to parent) + self, in order
        ancestors = list(cat.get_ancestors(include_self=False))
        for a in ancestors:
            if a.id not in seen:
                seen.add(a.id)
                result.append(a)
        if cat.id not in seen:
            seen.add(cat.id)
            result.append(cat)
    return result


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    list_images = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(),
        many=True,
        required=False
    )
    categories = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        many=True,
        required=False
    )
    allowed_customer_groups = serializers.PrimaryKeyRelatedField(
        queryset=CustomerGroup.objects.all(),
        many=True,
        required=False,
    )
    variants = VariantSerializer(many=True, required=False)
    group_prices = ProductGroupPriceSerializer(many=True, required=False)
    quantity_discounts = ProductTierDiscountSerializer(many=True, required=False)

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "short_description",
            "description",
            "product_type",
            "digital_subtype",
            "downloadable_file",
            "downloadable_files",
            "streaming_source",
            "streaming_url",
            "streaming_video",
            "streaming_hls_path",
            "custom_input_definitions",
            "code",
            "stock",
            "stock_unlimited",
            "soled",
            "categories",
            "tags",
            "price",
            "sell_price",
            "cooperate_price",
            "main_image",
            "list_images",
            "allowed_customer_groups",
            "is_wholesale_mode",
            "min_order_quantity",
            "max_order_quantity",
            "pack_size",
            "min_pack_count",
            "variants",
            "group_prices",
            "quantity_discounts",
            "information",
            "is_active",
        ]
        extra_kwargs = {
            'code': {'read_only': True},
        }

    def _apply_variant_selections(self, variant: Variant, selections):
        VariantAttributeSelection.objects.filter(variant=variant).delete()
        if not selections:
            return

        store = variant.store
        seen = set()
        for item in selections:
            attr_id = item.get("attribute_id")
            value_id = item.get("value_id")
            if not attr_id or not value_id:
                continue
            if str(attr_id) in seen:
                raise serializers.ValidationError(
                    {"variants": [{"selections": "هر ویژگی فقط یک‌بار می‌تواند انتخاب شود."}]}
                )
            seen.add(str(attr_id))
            try:
                attribute = VariantAttribute.objects.get(store=store, id=attr_id)
            except VariantAttribute.DoesNotExist:
                raise serializers.ValidationError(
                    {"variants": [{"selections": "نوع ویژگی نامعتبر است."}]}
                )
            try:
                value = VariantAttributeValue.objects.get(
                    store=store, id=value_id, attribute=attribute
                )
            except VariantAttributeValue.DoesNotExist:
                raise serializers.ValidationError(
                    {"variants": [{"selections": "مقدار ویژگی نامعتبر است."}]}
                )
            VariantAttributeSelection.objects.create(
                variant=variant, attribute=attribute, value=value
            )

    def _validate_customer_groups(self, store, groups):
        if not groups:
            return
        for group in groups:
            if group.store_id != store.id:
                raise serializers.ValidationError("Customer groups must belong to the active store.")

    def _sync_group_prices(self, product: Product, group_prices_data):
        ProductGroupPrice.objects.filter(product=product).delete()
        if not group_prices_data:
            return

        for item in group_prices_data:
            customer_group = item["customer_group"]
            variant = item.get("variant")
            if customer_group.store_id != product.store_id:
                raise serializers.ValidationError("Invalid customer group for this store.")
            if variant and variant.product_id != product.id:
                raise serializers.ValidationError("Variant in group pricing must belong to this product.")
            if product.is_wholesale_mode and variant is not None:
                raise serializers.ValidationError(
                    "Wholesale mode does not allow variant-level group pricing."
                )
            ProductGroupPrice.objects.create(
                store=product.store,
                product=product,
                variant=variant,
                customer_group=customer_group,
                price=item.get("price"),
                sell_price=item["sell_price"],
                is_active=item.get("is_active", True),
            )

    def _sync_quantity_discounts(self, product: Product, quantity_discounts_data):
        ProductTierDiscount.objects.filter(product=product).delete()
        if not quantity_discounts_data:
            return
        for item in quantity_discounts_data:
            customer_group = item.get("customer_group")
            if customer_group and customer_group.store_id != product.store_id:
                raise serializers.ValidationError("Invalid customer group for quantity discount.")
            ProductTierDiscount.objects.create(
                store=product.store,
                product=product,
                customer_group=customer_group,
                min_quantity=item["min_quantity"],
                max_quantity=item.get("max_quantity"),
                discount_percent=item["discount_percent"],
                is_active=item.get("is_active", True),
            )

    def create(self, validated_data):
        store = validated_data.get("store") or (
            self.context.get("request") and getattr(self.context["request"], "store", None)
        )
        if store:
            from account.admin_utils import get_store_max_products
            max_products = get_store_max_products(store)
            if max_products is not None:
                current_count = Product.objects.filter(store=store).count()
                if current_count >= max_products:
                    raise serializers.ValidationError(
                        f"به حد مجاز تعداد محصولات ({max_products}) در پلن فعلی رسیده‌اید. برای افزودن محصول جدید، پلن خود را ارتقا دهید."
                    )
        variants_data = validated_data.pop("variants", [])
        group_prices_data = validated_data.pop("group_prices", [])
        quantity_discounts_data = validated_data.pop("quantity_discounts", [])
        allowed_groups_data = validated_data.pop("allowed_customer_groups", [])
        list_images_data = validated_data.pop("list_images", [])
        tags_data = validated_data.pop("tags", [])
        categories_data = validated_data.pop("categories", [])

        if validated_data.get("is_wholesale_mode") and variants_data:
            raise serializers.ValidationError(
                {"variants": "Wholesale mode does not allow product variants."}
            )
        if store:
            self._validate_customer_groups(store, allowed_groups_data)
        product = Product.objects.create(**validated_data)

        # Expand categories with ancestors and set
        if categories_data:
            expanded = _expand_categories_with_ancestors([c.id for c in categories_data])
            product.categories.set(expanded)

        # Set the many-to-many relationship using .set()
        product.list_images.set(list_images_data)
        product.tags.set(tags_data)
        if allowed_groups_data:
            product.allowed_customer_groups.set(allowed_groups_data)
        
        # Create variants
        for variant_data in variants_data:
            selections = variant_data.pop("selections", [])
            list_images = variant_data.pop("list_images", None)
            variant = Variant.objects.create(product=product, **variant_data)
            if list_images is not None:
                variant.list_images.set(list_images)
            self._apply_variant_selections(variant, selections)
        if len(variants_data) != 0:
            product.update_stock()

        self._sync_group_prices(product, group_prices_data)
        self._sync_quantity_discounts(product, quantity_discounts_data)
            
        return product
    def update(self, instance, validated_data):
        variants_data = validated_data.pop("variants", None)
        group_prices_data = validated_data.pop("group_prices", None)
        quantity_discounts_data = validated_data.pop("quantity_discounts", None)
        allowed_groups_data = validated_data.pop("allowed_customer_groups", None)
        list_images_data = validated_data.pop("list_images", None)
        tags_data = validated_data.pop("tags", None)
        categories_data = validated_data.pop("categories", None)

        next_wholesale_mode = validated_data.get("is_wholesale_mode", instance.is_wholesale_mode)
        if next_wholesale_mode and variants_data is not None and len(variants_data) > 0:
            raise serializers.ValidationError(
                {"variants": "Wholesale mode does not allow product variants."}
            )
        if next_wholesale_mode and variants_data is None and instance.variants.exists():
            raise serializers.ValidationError(
                {"variants": "Disable variants before enabling wholesale mode."}
            )
        if allowed_groups_data is not None:
            self._validate_customer_groups(instance.store, allowed_groups_data)

        # Update product fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Set categories (expand with ancestors)
        if categories_data is not None:
            expanded = _expand_categories_with_ancestors([c.id for c in categories_data])
            instance.categories.set(expanded)

        # Set the many-to-many relationship using .set()
        if list_images_data is not None:
            instance.list_images.set(list_images_data)
        if tags_data is not None:
            instance.tags.set(tags_data)
        if allowed_groups_data is not None:
            instance.allowed_customer_groups.set(allowed_groups_data)
        instance.save()

        if group_prices_data is not None:
            self._sync_group_prices(instance, group_prices_data)
        if quantity_discounts_data is not None:
            self._sync_quantity_discounts(instance, quantity_discounts_data)

        # Handle variants update
        if variants_data is not None:
            # Delete variants not in the request
            existing_variants = set(instance.variants.values_list('id', flat=True))
            new_variants_ids = {v.get('id') for v in variants_data if v.get('id')}
            to_delete = existing_variants - new_variants_ids

            # If current main_variant is going to be deleted, clear it first to avoid FK error
            if instance.main_variant_id and instance.main_variant_id in to_delete:
                instance.main_variant = None
                instance.save(update_fields=['main_variant'])
            instance.variants.filter(id__in=to_delete).delete()
            
            # Update or create variants
            for variant_data in variants_data:
                variant_id = variant_data.get('id')
                selections = variant_data.pop("selections", None)
                list_images = variant_data.pop("list_images", None)
                if variant_id:
                    variant = get_object_or_404(Variant, id=variant_id, product=instance)
                    for attr, value in variant_data.items():
                        setattr(variant, attr, value)
                    variant.save()
                    if list_images is not None:
                        variant.list_images.set(list_images)
                    if selections is not None:
                        self._apply_variant_selections(variant, selections)
                else:
                    variant = Variant.objects.create(product=instance, **variant_data)
                    if list_images is not None:
                        variant.list_images.set(list_images)
                    if selections is not None:
                        self._apply_variant_selections(variant, selections)
            instance.update_stock()

            if next_wholesale_mode:
                if instance.main_variant_id is not None:
                    instance.main_variant = None
                    instance.save(update_fields=["main_variant"])
            else:
                # Ensure main_variant exists and points to a valid variant
                if instance.main_variant_id is None or not instance.variants.filter(id=instance.main_variant_id).exists():
                    first_variant = instance.variants.first()
                    if first_variant:
                        instance.main_variant = first_variant
                        instance.price = first_variant.price
                        instance.sell_price = first_variant.sell_price
                        instance.cooperate_price = first_variant.cooperate_price
                        instance.save(update_fields=['main_variant','price','sell_price','cooperate_price'])
        return instance


class ProductSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    sell_price = serializers.SerializerMethodField()
    main_image = MediaSerializer(read_only=True)
    list_images = MediaSerializer(many=True, read_only=True)
    downloadable_file = MediaSerializer(read_only=True)
    streaming_video = MediaSerializer(read_only=True)
    main_variant = VariantSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    variants = VariantSerializer(many=True, read_only=True)
    allowed_customer_groups = CustomerGroupLiteSerializer(many=True, read_only=True)
    group_prices = ProductGroupPriceSerializer(many=True, read_only=True)
    quantity_discounts = ProductTierDiscountSerializer(many=True, read_only=True)
    store = StorePublicSerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "store",
            "title",
            "short_description",
            "description",
            "product_type",
            "digital_subtype",
            "downloadable_file",
            "downloadable_files",
            "streaming_source",
            "streaming_url",
            "streaming_video",
            "streaming_hls_path",
            "custom_input_definitions",
            "code",
            "stock",
            "stock_unlimited",
            "soled",
            "categories",
            "tags",
            "price",
            "sell_price",
            "cooperate_price",
            "allowed_customer_groups",
            "is_wholesale_mode",
            "min_order_quantity",
            "max_order_quantity",
            "pack_size",
            "min_pack_count",
            "group_prices",
            "quantity_discounts",
            "variants",
        "main_image",
        "list_images",
        "main_variant",
        "information",
        "is_active",
        "average_rating",
        "reviews_count",
        "created_at",
        "updated_at",
    ]

    def _get_request_store_user(self):
        request = self.context.get("request")
        if not request:
            return None
        if getattr(request, "_resolved_store_user_cached", False):
            return getattr(request, "_resolved_store_user", None)
        store_user = getattr(request, "store_user", None)
        if store_user:
            setattr(request, "_resolved_store_user", store_user)
            setattr(request, "_resolved_store_user_cached", True)
            return store_user

        user = getattr(request, "user", None)
        store = getattr(request, "store", None)
        if not user or not user.is_authenticated or not store:
            setattr(request, "_resolved_store_user", None)
            setattr(request, "_resolved_store_user_cached", True)
            return None

        resolved_store_user = (
            StoreUser.objects.filter(store=store, user=user)
            .order_by("-level", "-is_admin", "-register_at")
            .first()
        )
        setattr(request, "_resolved_store_user", resolved_store_user)
        setattr(request, "_resolved_store_user_cached", True)
        return resolved_store_user

    def _is_store_manager(self, store_user):
        if not store_user:
            return False
        return store_user.is_store_owner or store_user.has_section_permission("products", "read")

    def _resolve_display_prices(self, obj):
        store_user = self._get_request_store_user()
        base_price, sell_price, _ = resolve_group_specific_price(
            product=obj,
            store_user=store_user,
            variant=None,
        )
        return base_price, sell_price

    def to_representation(self, instance):
        data = super().to_representation(instance)
        store_user = self._get_request_store_user()
        if not self._is_store_manager(store_user):
            data.pop("allowed_customer_groups", None)
            data.pop("group_prices", None)
            data.pop("quantity_discounts", None)
        return data

    def get_price(self, obj):
        base_price, _ = self._resolve_display_prices(obj)
        return str(base_price)

    def get_sell_price(self, obj):
        _, sell_price = self._resolve_display_prices(obj)
        return str(sell_price)


class TorobProductSerializer(serializers.ModelSerializer):
    product_id = serializers.CharField(source="code")
    page_url = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()
    old_price = serializers.CharField(source="price")

    class Meta:
        model = Product
        fields = [
            "product_id",
            "page_url",
            "price", 
            "availability",
            "old_price",
        ]

    def get_page_url(self, obj):
        return f"https://ropomoda.com/product/rp-{obj.code}/"

    def get_availability(self, obj):
        return "in_stock" if (obj.stock_unlimited or (obj.stock or 0) > 0) else "out_of_stock"

    def get_price(self, obj):
        return str(obj.sell_price)


class OrderItemProductSerializer(serializers.ModelSerializer):
    main_image = MediaSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "short_description",
            "description",
            "product_type",
            "digital_subtype",
            "downloadable_file",
            "downloadable_files",
            "custom_input_definitions",
            "code",
            "stock",
            "stock_unlimited",
            "soled",
            "categories",
            "price",
            "sell_price",
            "cooperate_price",
            "main_image",
            "information",
            "created_at",
            "updated_at",
        ]


class OrderItemVariantSerializer(serializers.ModelSerializer):
    main_image = MediaSerializer(read_only=True)
    list_images = MediaSerializer(many=True, read_only=True)
    product = OrderItemProductSerializer(read_only=True)
    attribute_values = serializers.SerializerMethodField()

    class Meta:
        model = Variant
        fields = [
            "id",
            "price",
            "sell_price",
            "cooperate_price",
            "main_image",
            "list_images",
            "product",
            "stock",
            "stock_unlimited",
            "attribute_values",
        ]

    def get_attribute_values(self, obj: Variant):
        return VariantSerializer(obj).data.get("attribute_values", [])
