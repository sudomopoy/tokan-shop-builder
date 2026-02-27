"""
ذخیره درخواست‌های پشتیبانی و مشاوره از لندینگ توکان
"""
from django.db import models


class SupportRequest(models.Model):
    """درخواست پشتیبانی یا مشاوره از فرم تماس لندینگ"""

    name = models.CharField(max_length=200, verbose_name="نام و نام خانوادگی")
    phone = models.CharField(max_length=20, verbose_name="شماره تماس")
    business_type = models.CharField(
        max_length=100,
        verbose_name="نوع کسب‌وکار",
        blank=True,
    )
    message = models.TextField(verbose_name="توضیحات", blank=True)
    source = models.CharField(
        max_length=50,
        default="landing",
        verbose_name="منبع",
        help_text="مثلاً landing, pricing, showcase",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")

    class Meta:
        verbose_name = "درخواست پشتیبانی/مشاوره"
        verbose_name_plural = "درخواست‌های پشتیبانی و مشاوره"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.phone}"
