from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from core.abstract_models import BaseModel, BaseStoreModel


class ServiceCategory(BaseStoreModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "title"]
        unique_together = [["store", "title"]]
        verbose_name = "دسته‌بندی خدمات"
        verbose_name_plural = "دسته‌بندی‌های خدمات"

    def __str__(self):
        return f"{self.title} ({self.store.name})"


class ServiceProvider(BaseStoreModel):
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
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "title"]
        verbose_name = "ارائه‌دهنده خدمات"
        verbose_name_plural = "ارائه‌دهندگان خدمات"

    def __str__(self):
        return f"{self.title} ({self.store.name})"


class Service(BaseStoreModel):
    provider = models.ForeignKey(
        ServiceProvider,
        on_delete=models.CASCADE,
        related_name="services",
    )
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.SET_NULL,
        related_name="services",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveIntegerField(
        default=30,
        validators=[MinValueValidator(5), MaxValueValidator(720)],
        help_text="مدت زمان سرویس به دقیقه",
    )
    price = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["provider", "sort_order", "title"]
        verbose_name = "سرویس"
        verbose_name_plural = "سرویس‌ها"

    def clean(self):
        if self.provider_id and self.store_id and self.provider.store_id != self.store_id:
            raise ValidationError({"provider": "ارائه‌دهنده انتخاب‌شده برای این فروشگاه نیست."})
        if self.category_id and self.store_id and self.category.store_id != self.store_id:
            raise ValidationError({"category": "دسته‌بندی انتخاب‌شده برای این فروشگاه نیست."})

    def __str__(self):
        return f"{self.provider.title} - {self.title}"


class ReservationSetting(BaseStoreModel):
    timezone = models.CharField(max_length=64, default="Asia/Tehran")
    slot_interval_minutes = models.PositiveIntegerField(
        default=30,
        validators=[MinValueValidator(5), MaxValueValidator(240)],
    )
    booking_window_days = models.PositiveIntegerField(
        default=30,
        validators=[MinValueValidator(1), MaxValueValidator(365)],
    )
    min_advance_minutes = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(30 * 24 * 60)],
    )
    use_public_holidays = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["store"], name="uniq_reservation_setting_per_store"),
        ]
        verbose_name = "تنظیمات رزرواسیون"
        verbose_name_plural = "تنظیمات رزرواسیون"

    def __str__(self):
        return f"Settings ({self.store.name})"


class ProviderWorkingHour(BaseStoreModel):
    WEEKDAY_CHOICES = [
        (0, "دوشنبه"),
        (1, "سه‌شنبه"),
        (2, "چهارشنبه"),
        (3, "پنجشنبه"),
        (4, "جمعه"),
        (5, "شنبه"),
        (6, "یکشنبه"),
    ]

    provider = models.ForeignKey(
        ServiceProvider,
        on_delete=models.CASCADE,
        related_name="working_hours",
    )
    weekday = models.PositiveSmallIntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_capacity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["provider", "weekday", "start_time"]
        unique_together = [["provider", "weekday", "start_time", "end_time"]]
        verbose_name = "ساعت کاری ارائه‌دهنده"
        verbose_name_plural = "ساعات کاری ارائه‌دهندگان"

    def clean(self):
        if self.provider_id and self.store_id and self.provider.store_id != self.store_id:
            raise ValidationError({"provider": "ارائه‌دهنده انتخاب‌شده برای این فروشگاه نیست."})
        if self.end_time <= self.start_time:
            raise ValidationError({"end_time": "زمان پایان باید بعد از زمان شروع باشد."})

    def __str__(self):
        return f"{self.provider.title} - {self.get_weekday_display()} {self.start_time}-{self.end_time}"


class ProviderTimeOff(BaseStoreModel):
    provider = models.ForeignKey(
        ServiceProvider,
        on_delete=models.CASCADE,
        related_name="time_offs",
    )
    date = models.DateField()
    title = models.CharField(max_length=255, blank=True)
    is_full_day = models.BooleanField(default=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["date", "start_time"]
        unique_together = [["provider", "date", "start_time", "end_time"]]
        verbose_name = "تعطیلی ارائه‌دهنده"
        verbose_name_plural = "تعطیلات ارائه‌دهندگان"

    def clean(self):
        if self.provider_id and self.store_id and self.provider.store_id != self.store_id:
            raise ValidationError({"provider": "ارائه‌دهنده انتخاب‌شده برای این فروشگاه نیست."})
        if self.is_full_day:
            self.start_time = None
            self.end_time = None
        elif bool(self.start_time) != bool(self.end_time):
            raise ValidationError("برای تعطیلی ساعتی باید شروع و پایان هر دو مشخص باشند.")
        elif self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValidationError({"end_time": "زمان پایان باید بعد از زمان شروع باشد."})

    def __str__(self):
        return f"{self.provider.title} - {self.date}"


class PublicHoliday(BaseModel):
    date = models.DateField(unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["date"]
        verbose_name = "تعطیلی عمومی"
        verbose_name_plural = "تعطیلات عمومی"

    def __str__(self):
        return f"{self.date} - {self.title}"


class TimeSlot(BaseStoreModel):
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="time_slots",
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    capacity = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["date", "start_time"]
        verbose_name = "بازه زمانی"
        verbose_name_plural = "بازه‌های زمانی"
        unique_together = [["service", "date", "start_time"]]

    def clean(self):
        if self.service_id and self.store_id and self.service.store_id != self.store_id:
            raise ValidationError({"service": "سرویس انتخاب‌شده برای این فروشگاه نیست."})
        if self.end_time <= self.start_time:
            raise ValidationError({"end_time": "زمان پایان باید بعد از زمان شروع باشد."})

    def __str__(self):
        return f"{self.service} - {self.date} {self.start_time}"


class Appointment(BaseStoreModel):
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

    def clean(self):
        if self.time_slot_id and self.store_id and self.time_slot.store_id != self.store_id:
            raise ValidationError({"time_slot": "بازه زمانی انتخاب‌شده برای این فروشگاه نیست."})

    def __str__(self):
        return f"{self.store_user} - {self.time_slot} ({self.status})"

    @property
    def service(self):
        return self.time_slot.service
