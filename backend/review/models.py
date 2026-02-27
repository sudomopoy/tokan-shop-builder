from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from core.abstract_models import BaseStoreModel


class ProductReview(BaseStoreModel):
    """
    نظرات کاربران برای محصولات.
    - کاربر باید ثبت‌نام کرده باشد
    - نظر ابتدا وضعیت pending دارد تا ادمین/صاحب فروشگاه تایید کند
    - امتیاز ۱ تا ۵ ستاره روی میانگین امتیاز محصول اثر می‌گذارد
    """

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "در انتظار تایید"),
        (STATUS_APPROVED, "تایید شده"),
        (STATUS_REJECTED, "رد شده"),
    ]

    product = models.ForeignKey(
        "product.Product",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    store_user = models.ForeignKey(
        "account.StoreUser",
        on_delete=models.CASCADE,
        related_name="product_reviews",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="امتیاز از ۱ تا ۵ ستاره",
    )
    body = models.TextField(
        verbose_name="متن نظر",
        blank=True,
        default="",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        "account.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_reviews",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "نظر محصول"
        verbose_name_plural = "نظرات محصولات"
        unique_together = [("product", "store_user")]

    def __str__(self):
        return f"{self.product.title} - {self.store_user.display_name} ({self.rating}★)"
