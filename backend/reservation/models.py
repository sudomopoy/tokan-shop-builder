import uuid
from django.db import models
from django.core.validators import MinValueValidator
from core.abstract_models import BaseStoreModel


class ServiceProvider(BaseStoreModel):
    """ارائه‌دهنده خدمات (مثل پزشک، آرایشگر)"""
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    avatar = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reservation_providers",
    )
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "title"]
        verbose_name = "ارائه‌دهنده خدمات"
        verbose_name_plural = "ارائه‌دهندگان خدمات"

    def __str__(self):
        return f"{self.title} ({self.store.name})"


class Service(BaseStoreModel):
    """سرویس هر ارائه‌دهنده (مثل ویزیت، اصلاح مو)"""
    provider = models.ForeignKey(
        ServiceProvider,
        on_delete=models.CASCADE,
        related_name="services",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveIntegerField(
        default=30,
        validators=[MinValueValidator(5)],
        help_text="مدت زمان سرویس به دقیقه",
    )
    price = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["provider", "sort_order", "title"]
        verbose_name = "سرویس"
        verbose_name_plural = "سرویس‌ها"

    def __str__(self):
        return f"{self.provider.title} - {self.title}"


class TimeSlot(BaseStoreModel):
    """بازه زمانی قابل رزرو"""
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="time_slots",
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    capacity = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["date", "start_time"]
        verbose_name = "بازه زمانی"
        verbose_name_plural = "بازه‌های زمانی"
        unique_together = [["service", "date", "start_time"]]

    def __str__(self):
        return f"{self.service} - {self.date} {self.start_time}"


class Appointment(BaseStoreModel):
    """رزرو انجام‌شده"""
    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "در انتظار تایید"),
        (STATUS_CONFIRMED, "تایید شده"),
        (STATUS_COMPLETED, "انجام شده"),
        (STATUS_CANCELLED, "لغو شده"),
    ]

    store_user = models.ForeignKey(
        "account.StoreUser",
        on_delete=models.CASCADE,
        related_name="appointments",
    )
    time_slot = models.ForeignKey(
        TimeSlot,
        on_delete=models.PROTECT,
        related_name="appointments",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    notes = models.TextField(blank=True)
    payment = models.ForeignKey(
        "payment.Payment",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reservation_appointments",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "رزرو"
        verbose_name_plural = "رزروها"

    def __str__(self):
        return f"{self.store_user} - {self.time_slot} ({self.status})"

    @property
    def service(self):
        return self.time_slot.service
