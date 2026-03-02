# models.py
from django.db import models
from django.db.models import JSONField
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from ckeditor.fields import RichTextField
from core.abstract_models import BaseStoreModel, BaseModel


class VariantAttribute(BaseStoreModel):
    """
    Store-level definition of a variant attribute (e.g. color/size/volume/weight/custom).
    """

    DISPLAY_TYPE_CHOICES = [
        ("color", "Color"),
        ("text", "Text"),
        ("number", "Number"),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100)
    display_type = models.CharField(
        max_length=20, choices=DISPLAY_TYPE_CHOICES, default="text"
    )
    unit = models.CharField(max_length=50, blank=True, default="")
    is_system = models.BooleanField(default=False)

    class Meta:
        unique_together = ("store", "slug")

    def __str__(self):
        return f"{self.title} ({self.slug})"


class VariantAttributeValue(BaseStoreModel):
    """
    A reusable value for an attribute.

    `code` can be:
    - a hex color (for display_type='color')
    - a textual/internal code (e.g. '500ml', '2kg', etc.)
    """

    attribute = models.ForeignKey(
        VariantAttribute, on_delete=models.CASCADE, related_name="values"
    )
    title = models.CharField(max_length=255)
    code = models.CharField(max_length=100, blank=True, default="")
    sort_order = models.IntegerField(default=0)

    class Meta:
        unique_together = ("store", "attribute", "title")
        ordering = ["sort_order", "title"]

    def __str__(self):
        return f"{self.attribute.slug}: {self.title}"


class VariantAttributeSelection(BaseModel):
    """
    Selected value for an attribute on a specific Variant.

    Invariants:
    - each (variant, attribute) can have only one value
    - value.attribute must equal attribute
    """

    variant = models.ForeignKey(
        "Variant", on_delete=models.CASCADE, related_name="attribute_selections"
    )
    attribute = models.ForeignKey(
        VariantAttribute, on_delete=models.PROTECT, related_name="selections"
    )
    value = models.ForeignKey(
        VariantAttributeValue, on_delete=models.PROTECT, related_name="selections"
    )

    class Meta:
        unique_together = ("variant", "attribute")

    def __str__(self):
        return f"{self.variant_id} {self.attribute.slug}={self.value.title}"


class Variant(BaseStoreModel):
    price = models.DecimalField(max_digits=20, decimal_places=2, blank=True)
    sell_price = models.DecimalField(max_digits=20, decimal_places=2, blank=True)
    cooperate_price = models.DecimalField(
        max_digits=20, decimal_places=2, blank=True, null=True
    )

    main_image = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        related_name="main_image_variant",
        on_delete=models.CASCADE,
    )
    list_images = models.ManyToManyField(
        "media.Media", blank=True, related_name="list_images_variant"
    )

    stock = models.PositiveIntegerField(default=0)
    stock_unlimited = models.BooleanField(default=False)

    attribute_values = models.ManyToManyField(
        VariantAttributeValue,
        through=VariantAttributeSelection,
        related_name="variants",
        blank=True,
    )

    product = models.ForeignKey(
        "Product",
        on_delete=models.CASCADE,
        related_name="variants"
    )

    def save(self, *args, **kwargs):
        if not self.price:
            self.price = self.product.price
        if not self.sell_price:
            self.sell_price = self.product.sell_price
        if not self.cooperate_price:
            self.cooperate_price = self.product.cooperate_price
        super().save(*args, **kwargs)
        self.update_product()

    def update_product(self):
        product = self.product
        variants = list(product.variants.all())
        product.stock = sum(v.stock for v in variants)
        product.stock_unlimited = any(v.stock_unlimited for v in variants)
        
        if not product.main_variant:
            product.main_variant = self
            
        product.save()

    def __str__(self):
        return f"{self.product.code} {self.product.title} {self.id}"


class Product(BaseStoreModel):
    PRODUCT_TYPE_PHYSICAL = "physical"
    PRODUCT_TYPE_DIGITAL = "digital"
    PRODUCT_TYPE_CHOICES = [
        (PRODUCT_TYPE_PHYSICAL, "فیزیکی"),
        (PRODUCT_TYPE_DIGITAL, "دیجیتال"),
    ]
    DIGITAL_SUBTYPE_DOWNLOADABLE = "downloadable"
    DIGITAL_SUBTYPE_STREAMING = "streaming"
    DIGITAL_SUBTYPE_REQUEST_ONLY = "request_only"
    DIGITAL_SUBTYPE_CHOICES = [
        (DIGITAL_SUBTYPE_DOWNLOADABLE, "دانلودی"),
        (DIGITAL_SUBTYPE_STREAMING, "استریمینگ"),
        (DIGITAL_SUBTYPE_REQUEST_ONLY, "ثبت درخواست"),
    ]

    title = models.CharField(max_length=255)
    short_description = models.CharField(max_length=300, default="", blank=True)
    description = RichTextField(default="", blank=True)

    product_type = models.CharField(
        max_length=20,
        choices=PRODUCT_TYPE_CHOICES,
        default=PRODUCT_TYPE_PHYSICAL,
    )
    digital_subtype = models.CharField(
        max_length=30,
        choices=DIGITAL_SUBTYPE_CHOICES,
        blank=True,
        null=True,
        help_text="فقط برای محصولات دیجیتال",
    )
    downloadable_file = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="downloadable_products",
        help_text="فایل دانلودی (legacy - ترجیح استفاده از downloadable_files)",
    )
    downloadable_files = models.JSONField(
        default=list,
        blank=True,
        help_text='آرایه فایل‌ها: [{"media_id":"uuid","title":"","description":""}]',
    )
    STREAMING_SOURCE_EXTERNAL = "external_link"
    STREAMING_SOURCE_UPLOADED = "uploaded"
    STREAMING_SOURCE_CHOICES = [
        (STREAMING_SOURCE_EXTERNAL, "لینک استریم خارجی"),
        (STREAMING_SOURCE_UPLOADED, "آپلود ویدیو (HLS)"),
    ]
    streaming_source = models.CharField(
        max_length=20,
        choices=STREAMING_SOURCE_CHOICES,
        default=STREAMING_SOURCE_EXTERNAL,
        blank=True,
        help_text="منبع استریم: لینک خارجی یا آپلود",
    )
    streaming_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="لینک استریم خارجی - فقط وقتی streaming_source=external_link",
    )
    streaming_video = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="streaming_source_products",
        help_text="فایل ویدیوی آپلودشده - فقط وقتی streaming_source=uploaded",
    )
    streaming_hls_path = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="مسیر HLS پردازش‌شده - پر می‌شود پس از تبدیل ویدیو",
    )
    custom_input_definitions = models.JSONField(
        default=list,
        blank=True,
        help_text='آرایه تعریف ورودی‌ها، مثلاً: [{"key":"email","label":"ایمیل","type":"email","required":true}]',
    )

    code = models.IntegerField(unique=True, null=True, blank=True)
    stock = models.PositiveIntegerField(blank=True, null=True, default=0)
    stock_unlimited = models.BooleanField(default=False)
    soled = models.PositiveIntegerField(default=0)

    price = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    sell_price = models.DecimalField(
        max_digits=20, decimal_places=2, blank=True, null=True
    )
    cooperate_price = models.DecimalField(
        max_digits=20, decimal_places=2, blank=True, null=True
    )
    categories = models.ManyToManyField(
        "category.Category", blank=True, related_name="products"
    )
    tags = models.ManyToManyField(
        "tag.Tag", blank=True, related_name="products"
    )
    allowed_customer_groups = models.ManyToManyField(
        "account.CustomerGroup",
        blank=True,
        related_name="allowed_products",
    )
    is_wholesale_mode = models.BooleanField(default=False)
    min_order_quantity = models.PositiveIntegerField(null=True, blank=True)
    max_order_quantity = models.PositiveIntegerField(null=True, blank=True)
    pack_size = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    min_pack_count = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])

    is_active = models.BooleanField(default=True)
    is_accepted_to_dsiaply_on_super_store = models.BooleanField(default=False)
    main_image = models.ForeignKey(
        "media.Media",
        related_name="product_main_image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    list_images = models.ManyToManyField(
        "media.Media", blank=True, related_name="list_images_product"
    )

    main_variant = models.ForeignKey(
        Variant,
        null=True,
        blank=True,
        related_name="main_variant_product",
        on_delete=models.SET_NULL,
    )
    information = JSONField(default=dict, blank=True, null=True)
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="میانگین امتیاز نظرات تایید شده (۱–۵)",
    )
    reviews_count = models.PositiveIntegerField(
        default=0,
        help_text="تعداد نظرات تایید شده",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.code:
            max_id = Product.objects.all().aggregate(models.Max("code"))["code__max"]
            self.code = max_id + 1 if max_id is not None else 10000

        if self.min_order_quantity is not None and self.min_order_quantity < 1:
            raise ValidationError("min_order_quantity must be at least 1.")
        if self.max_order_quantity is not None and self.max_order_quantity < 1:
            raise ValidationError("max_order_quantity must be at least 1.")
        if (
            self.min_order_quantity is not None
            and self.max_order_quantity is not None
            and self.max_order_quantity < self.min_order_quantity
        ):
            raise ValidationError("max_order_quantity must be greater than or equal to min_order_quantity.")
        if self.pack_size < 1:
            raise ValidationError("pack_size must be at least 1.")
        if self.min_pack_count < 1:
            raise ValidationError("min_pack_count must be at least 1.")
        if self.is_wholesale_mode and self.main_variant_id:
            raise ValidationError("Wholesale products cannot have a main variant.")
        
        if self.main_variant:
            self.price = self.main_variant.price
            self.sell_price = self.main_variant.sell_price
            self.cooperate_price = self.main_variant.cooperate_price
            
        super().save(*args, **kwargs)

    def update_stock(self):
        variants = list(self.variants.all())
        self.stock = sum(v.stock for v in variants)
        self.stock_unlimited = any(v.stock_unlimited for v in variants)
        self.save(update_fields=["stock", "stock_unlimited"])

    @property
    def is_digital(self):
        return self.product_type == self.PRODUCT_TYPE_DIGITAL

    def __str__(self):
        return f"{self.code} {self.title}"


class ProductGroupPrice(BaseStoreModel):
    """
    Optional group specific pricing for a product (and optionally for a variant).
    """

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="group_prices"
    )
    variant = models.ForeignKey(
        Variant,
        on_delete=models.CASCADE,
        related_name="group_prices",
        null=True,
        blank=True,
    )
    customer_group = models.ForeignKey(
        "account.CustomerGroup",
        on_delete=models.CASCADE,
        related_name="product_group_prices",
    )
    price = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    sell_price = models.DecimalField(max_digits=20, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("product", "variant", "customer_group")
        ordering = ("product_id", "variant_id", "customer_group_id")

    def clean(self):
        if self.variant_id and self.variant.product_id != self.product_id:
            raise ValidationError("Selected variant does not belong to product.")
        if self.customer_group_id and self.customer_group.store_id != self.store_id:
            raise ValidationError("Customer group must belong to the same store.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        variant_label = f" / variant:{self.variant_id}" if self.variant_id else ""
        return f"{self.product_id}{variant_label} / group:{self.customer_group_id} -> {self.sell_price}"


class ProductTierDiscount(BaseStoreModel):
    """
    Quantity based discount for a product, optionally scoped to a customer group.
    """

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="quantity_discounts"
    )
    customer_group = models.ForeignKey(
        "account.CustomerGroup",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="product_tier_discounts",
    )
    min_quantity = models.PositiveIntegerField(default=1)
    max_quantity = models.PositiveIntegerField(null=True, blank=True)
    discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("-min_quantity", "-discount_percent")

    def clean(self):
        if self.max_quantity is not None and self.max_quantity < self.min_quantity:
            raise ValidationError("max_quantity must be greater than or equal to min_quantity.")
        if self.customer_group_id and self.customer_group.store_id != self.store_id:
            raise ValidationError("Customer group must belong to the same store.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product_id} qty {self.min_quantity}-{self.max_quantity or 'inf'} => {self.discount_percent}%"


class StoreCartTierDiscount(BaseStoreModel):
    """
    Cart level tier discount by total amount or total items count.
    """

    CRITERION_AMOUNT = "amount"
    CRITERION_ITEMS_COUNT = "items_count"
    CRITERION_CHOICES = (
        (CRITERION_AMOUNT, "Amount"),
        (CRITERION_ITEMS_COUNT, "Items count"),
    )

    criterion = models.CharField(max_length=20, choices=CRITERION_CHOICES)
    min_value = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    max_value = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    customer_group = models.ForeignKey(
        "account.CustomerGroup",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="cart_tier_discounts",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("criterion", "-min_value", "-discount_percent")

    def clean(self):
        if self.max_value is not None and self.max_value < self.min_value:
            raise ValidationError("max_value must be greater than or equal to min_value.")
        if self.customer_group_id and self.customer_group.store_id != self.store_id:
            raise ValidationError("Customer group must belong to the same store.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.store_id} {self.criterion} {self.min_value}-{self.max_value or 'inf'} => {self.discount_percent}%"


class InventoryAdjustmentLog(BaseStoreModel):
    """
    Tracks inventory changes for auditing and dashboard stock management.
    """

    REASON_MANUAL_SET = "manual_set"
    REASON_MANUAL_INCREASE = "manual_increase"
    REASON_MANUAL_DECREASE = "manual_decrease"
    REASON_ORDER_DEDUCT = "order_deduct"
    REASON_ORDER_RESTORE = "order_restore"

    REASON_CHOICES = (
        (REASON_MANUAL_SET, "Manual set"),
        (REASON_MANUAL_INCREASE, "Manual increase"),
        (REASON_MANUAL_DECREASE, "Manual decrease"),
        (REASON_ORDER_DEDUCT, "Order deduct"),
        (REASON_ORDER_RESTORE, "Order restore"),
    )

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="inventory_logs"
    )
    variant = models.ForeignKey(
        Variant,
        on_delete=models.CASCADE,
        related_name="inventory_logs",
        null=True,
        blank=True,
    )
    reason = models.CharField(max_length=40, choices=REASON_CHOICES)
    quantity_before = models.IntegerField()
    quantity_after = models.IntegerField()
    quantity_change = models.IntegerField()
    note = models.TextField(blank=True, default="")
    actor_store_user = models.ForeignKey(
        "account.StoreUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_logs",
    )
    actor_user = models.ForeignKey(
        "account.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_inventory_logs",
    )
    order = models.ForeignKey(
        "order.Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_logs",
    )

    class Meta:
        ordering = ("-created_at",)

    def clean(self):
        if self.variant_id and self.variant.product_id != self.product_id:
            raise ValidationError("Selected variant does not belong to product.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product_id} {self.reason} {self.quantity_before}->{self.quantity_after}"
