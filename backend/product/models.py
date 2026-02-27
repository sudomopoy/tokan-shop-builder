# models.py
from django.db import models
from django.db.models import JSONField
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