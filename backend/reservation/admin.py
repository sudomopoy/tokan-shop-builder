from django.contrib import admin

from .models import (
    Appointment,
    ProviderTimeOff,
    ProviderWorkingHour,
    PublicHoliday,
    ReservationSetting,
    Service,
    ServiceCategory,
    ServiceProvider,
    TimeSlot,
)


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ["title", "store", "sort_order", "is_active"]
    list_filter = ["store", "is_active"]
    search_fields = ["title"]


@admin.register(ServiceProvider)
class ServiceProviderAdmin(admin.ModelAdmin):
    list_display = ["title", "store", "sort_order", "is_active"]
    list_filter = ["store", "is_active"]
    search_fields = ["title"]


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["title", "provider", "category", "duration_minutes", "price", "is_active", "sort_order"]
    list_filter = ["provider__store", "provider", "category", "is_active"]
    search_fields = ["title", "provider__title", "category__title"]


@admin.register(ReservationSetting)
class ReservationSettingAdmin(admin.ModelAdmin):
    list_display = [
        "store",
        "timezone",
        "slot_interval_minutes",
        "booking_window_days",
        "min_advance_minutes",
        "use_public_holidays",
    ]
    list_filter = ["use_public_holidays", "timezone"]
    search_fields = ["store__name", "store__title"]


@admin.register(ProviderWorkingHour)
class ProviderWorkingHourAdmin(admin.ModelAdmin):
    list_display = ["provider", "weekday", "start_time", "end_time", "slot_capacity", "is_active"]
    list_filter = ["store", "provider", "weekday", "is_active"]
    search_fields = ["provider__title"]


@admin.register(ProviderTimeOff)
class ProviderTimeOffAdmin(admin.ModelAdmin):
    list_display = ["provider", "date", "is_full_day", "start_time", "end_time", "is_active"]
    list_filter = ["store", "provider", "date", "is_full_day", "is_active"]
    search_fields = ["provider__title", "title"]


@admin.register(PublicHoliday)
class PublicHolidayAdmin(admin.ModelAdmin):
    list_display = ["date", "title", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["title", "description"]


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ["service", "date", "start_time", "end_time", "capacity", "is_active"]
    list_filter = ["date", "service", "service__provider", "is_active"]


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ["store_user", "time_slot", "status", "created_at"]
    list_filter = ["status", "store"]
    search_fields = ["store_user__display_name", "store_user__user__mobile"]
