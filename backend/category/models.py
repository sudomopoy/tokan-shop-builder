from django.db import models
from mptt.models import MPTTModel, TreeForeignKey
from django.conf import settings
from core.abstract_models import BaseStoreModel
from helper.slug import slugify
from .default_icons import ICON_CHOICES

class Category(BaseStoreModel, MPTTModel):
    module = models.CharField(
        choices=settings.MODULES_CHOICES, max_length=100, default="store"
    )
    name = models.CharField(max_length=100, unique=True)
    parent = TreeForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children"
    )
    icon = models.ForeignKey('media.Media', null=True,blank=True, on_delete=models.SET_NULL)
    icon_type = models.CharField(
        max_length=50, 
        choices=[('default', 'آیکون پیش‌فرض'), ('uploaded', 'آیکون آپلود شده')],
        default='default',
        help_text="نوع آیکون: پیش‌فرض یا آپلود شده"
    )
    default_icon = models.CharField(
        max_length=50, 
        choices=ICON_CHOICES,
        null=True, 
        blank=True,
        help_text="آیکون پیش‌فرض انتخاب شده"
    )
    icon_color = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="رنگ آیکون (hex مثلا #3B82F6) - برای آیکون پیش‌فرض"
    )
    slug = models.CharField(max_length=300, null=True)
    is_editable = models.BooleanField(default=True)
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        return super().save(*args, **kwargs)
    
    def get_icon_url(self):
        """Get the icon URL based on icon type"""
        if self.icon_type == 'uploaded' and self.icon:
            return self.icon.file.url
        elif self.icon_type == 'default' and self.default_icon:
            base = f"/category/icon/{self.default_icon}/"
            if self.icon_color:
                from urllib.parse import urlencode
                base += "?" + urlencode({"color": self.icon_color})
            return base
        return None
    
    def get_icon_svg(self):
        """Get the SVG content for default icons"""
        if self.icon_type == 'default' and self.default_icon:
            from .default_icons import DEFAULT_CATEGORY_ICONS
            return DEFAULT_CATEGORY_ICONS.get(self.default_icon, '')
        return None
    class MPTTMeta:
        order_insertion_by = ["name"]

    class Meta:
        indexes = [models.Index(fields=["name"])]
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name
