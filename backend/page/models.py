from django.db import models
from django.db.models import Max
from core.abstract_models import BaseStoreModel, BaseModel


class ThemeCategory(BaseModel):
    """دسته‌بندی تم‌ها - مثلاً فروشگاهی، شرکتی، مینیمال"""
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Theme Category"
        verbose_name_plural = "Theme Categories"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class ThemeTag(BaseModel):
    """تگ تم - برای فیلتر و جستجو"""
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Theme Tag"
        verbose_name_plural = "Theme Tags"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Theme(BaseModel):
    """
    مدل تم - هر تم متعلق به یک سرویس است
    slug برای تطابق با رجیستری فرانت‌اند، سایر فیلدها برای نمایش در فروشگاه
    """
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=100, unique=True, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    thumbnail = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="themes",
    )
    category = models.ForeignKey(
        ThemeCategory,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="themes",
    )
    tags = models.ManyToManyField(
        ThemeTag,
        blank=True,
        related_name="themes",
    )
    is_paid = models.BooleanField(default=False)
    price = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    demo_url = models.URLField(max_length=500, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Theme"
        verbose_name_plural = "Themes"

    def __str__(self):
        return self.name


class ThemeGalleryImage(BaseModel):
    """تصاویر گالری تم با توضیح"""
    theme = models.ForeignKey(
        Theme,
        on_delete=models.CASCADE,
        related_name="gallery_images",
    )
    media = models.ForeignKey(
        "media.Media",
        on_delete=models.CASCADE,
        related_name="theme_gallery_images",
    )
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Theme Gallery Image"
        verbose_name_plural = "Theme Gallery Images"
        ordering = ["order"]

    def __str__(self):
        return f"{self.theme.name} - {self.order}"

class Page(BaseStoreModel):
    """
    مدل صفحه - هر صفحه یک مسیر منحصر به فرد دارد.
    path می‌تواند مسیر ثابت یا الگوی داینامیک باشد:
    - ثابت: "/", "/about", "/contact"
    - داینامیک: "/product/:id:number/:slug?:string"
    (اگر path شامل : باشد به عنوان الگو تطبیق داده می‌شود)
    """
    path = models.CharField(
        max_length=500,
        help_text="مسیر ثابت (/ یا /about) یا الگوی داینامیک (/product/:id:number/:slug?:string)"
    )
    title = models.CharField(max_length=300, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # تنظیمات SEO
    meta_title = models.CharField(max_length=300, null=True, blank=True)
    meta_description = models.TextField(null=True, blank=True)
    meta_keywords = models.CharField(max_length=500, null=True, blank=True)

    class Meta:
        unique_together = [("store", "path")]
        ordering = ["path"]
        verbose_name = "Page"
        verbose_name_plural = "Pages"

    def __str__(self):
        return f"{self.store.name} - {self.path}"

    def get_config(self):
        """
        خروجی به فرمت PageConfig برای فرانت‌اند
        """
        layout_widget = self.widgets.filter(widget_type__is_layout=True).first()
        content_widgets = self.widgets.filter(widget_type__is_layout=False, is_active=True).order_by("index")
        
        return {
            "page": self.path,
            "layout": layout_widget.get_config() if layout_widget else None,
            "content": [widget.get_config() for widget in content_widgets],
        }

class WidgetType(BaseModel):
    """
    مدل ناوبری ویجت - هر ناوبری ویجت متعلق به یک صفحه است
    """
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    thumbnail = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="widget_types"
    )
    icon = models.CharField(
        max_length=120,
        null=True,
        blank=True,
        help_text="Dashboard icon key for visual builder, e.g. text, image, layout.",
    )
    visual_schema = models.JSONField(
        default=dict,
        blank=True,
        help_text="Visual input schema for dashboard page builder.",
    )
    default_widget_config = models.JSONField(default=dict, blank=True)
    default_components_config = models.JSONField(default=dict, blank=True)
    default_extra_request_params = models.JSONField(default=dict, blank=True)

    # آیا این ویجت layout است؟
    is_layout = models.BooleanField(
        default=False,
        help_text="آیا این ویجت، layout صفحه است؟"
    )
    
    # نسبت به تم
    theme = models.ForeignKey(
        Theme,
        on_delete=models.CASCADE,
        related_name="widget_types",
        null=True,
        blank=True,
    )
    
    is_active = models.BooleanField(default=True)
    def __str__(self):
        return self.name


class WidgetStyle(BaseModel):
    """Selectable design variants for a widget type."""

    widget_type = models.ForeignKey(
        WidgetType,
        on_delete=models.CASCADE,
        related_name="styles",
    )
    key = models.SlugField(max_length=100)
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    preview_image = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="widget_styles",
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    default_widget_config = models.JSONField(default=dict, blank=True)
    default_components_config = models.JSONField(default=dict, blank=True)
    default_extra_request_params = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Widget Style"
        verbose_name_plural = "Widget Styles"
        ordering = ["widget_type", "order", "name"]
        unique_together = [("widget_type", "key")]

    def __str__(self):
        return f"{self.widget_type.name} - {self.name}"


MODULES=(
    ("products", "Products"),
    ("categories", "Categories"),
    ("brands", "Brands"),
    ("articles", "Articles"),
    ("slider", "Slider"),
    ("menu", "Menu"),
)
class Widget(BaseModel):
    """
    مدل ویجت - هر ویجت متعلق به یک صفحه است
    مثال: "layout.default", "slider", "products.listview"
    """
    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name="widgets"
    )
    
    # نوع ویجت - مثل "layout.default", "slider", "products.listview"
    widget_type = models.ForeignKey(WidgetType, on_delete=models.CASCADE, related_name="widgets")
    
    # ترتیب نمایش ویجت
    index = models.PositiveIntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    
    # تنظیمات کامپوننت به صورت JSON
    # مثال: {"showPrice": true, "title": "Welcome"}
    components_config = models.JSONField(
        default=dict,
        blank=True,
        help_text="تنظیمات کامپوننت‌ها به صورت JSON"
    )
    
    # پارامترهای اضافی برای درخواست‌های API
    # مثال: {"products/list": {"s": "rswfgrs", "t": 21}}
    extra_request_params = models.JSONField(
        default=dict,
        blank=True,
        help_text="پارامترهای اضافی برای درخواست‌های API"
    )
    widget_config = models.JSONField(
        default=dict,
        blank=True,
        help_text="تنظیمات ویجت به صورت JSON"
    )
    class Meta:
        ordering = ["page", "index"]
        verbose_name = "Widget"
        verbose_name_plural = "Widgets"

    def __str__(self):
        return f"{self.page.path} - {self.widget_type} ({self.index})"

    def save(self, *args, **kwargs):
        # اگر index تعیین نشده، آخرین index + 1 را بگیر
        if self.pk is None and self.index == 0:
            max_index = Widget.objects.filter(
                page=self.page, 
                widget_type__is_layout=self.widget_type.is_layout
            ).aggregate(Max("index"))["index__max"]
            self.index = (max_index or 0) + 1
        
        
        super().save(*args, **kwargs)

    def get_config(self):
        """
        خروجی به فرمت WidgetConfig برای فرانت‌اند
        """
        config = {
            "index": self.index,
            "widget": self.widget_type,
        }
        
        if self.components_config:
            config["componentsConfig"] = self.components_config
            
        if self.extra_request_params:
            config["extraRequestParams"] = self.extra_request_params

        # تنظیمات اختصاصی خود ویجت (مثلاً slider_id برای ویجت اسلایدر)
        if self.widget_config:
            config["widgetConfig"] = self.widget_config
            
        return config


class WidgetTemplate(BaseModel):
    """
    قالب‌های آماده ویجت که کاربر می‌تواند از آنها استفاده کند
    این مدل برای ذخیره ویجت‌های از پیش تعریف شده استفاده می‌شود
    """
    name = models.CharField(max_length=200)
    widget_type = models.ForeignKey(WidgetType, on_delete=models.CASCADE, 
    related_name="widget_templates")
    description = models.TextField(null=True, blank=True)
    thumbnail = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="widget_templates"
    )
    
    # تنظیمات پیش‌فرض
    default_components_config = models.JSONField(default=dict, blank=True)
    default_extra_request_params = models.JSONField(default=dict, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(
        default=False,
        help_text="آیا این قالب عمومی است و قابل حذف نیست؟"
    )
    

    class Meta:
        ordering = ["widget_type", "name"]
        verbose_name = "Widget Template"
        verbose_name_plural = "Widget Templates"

    def __str__(self):
        return f"{self.widget_type.name} - {self.name}"

    def create_widget(self, page, index=0, is_layout=False):
        """
        ایجاد یک ویجت از روی این قالب
        """
        return Widget.objects.create(
            store=page.store,
            page=page,
            widget_type=self.widget_type,
            index=index,
            is_layout=is_layout,
            components_config=self.default_components_config.copy(),
            extra_request_params=self.default_extra_request_params.copy(),
        )
