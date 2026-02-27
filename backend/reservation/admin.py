from django.contrib import admin
from .models import ServiceProvider, Service, TimeSlot, Appointment


@admin.register(ServiceProvider)
class ServiceProviderAdmin(admin.ModelAdmin):
    list_display = ["title", "store", "sort_order"]
    list_filter = ["store"]
    search_fields = ["title"]


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["title", "provider", "duration_minutes", "price", "sort_order"]
    list_filter = ["provider__store"]
    search_fields = ["title", "provider__title"]


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ["service", "date", "start_time", "end_time", "capacity"]
    list_filter = ["date", "service"]


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ["store_user", "time_slot", "status", "created_at"]
    list_filter = ["status", "store"]
    search_fields = ["store_user__display_name", "store_user__user__mobile"]
