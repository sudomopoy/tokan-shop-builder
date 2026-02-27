from django.contrib import admin
from .models import SystemAnnouncement, SystemAnnouncementRead


@admin.register(SystemAnnouncement)
class SystemAnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "notification_type", "source", "store", "is_active", "created_at")
    list_filter = ("notification_type", "source", "is_active", "created_at")
    search_fields = ("title", "message")
    list_editable = ("is_active",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {
            "fields": ("title", "message", "notification_type", "source", "link", "store", "is_active"),
        }),
        ("زمان", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(SystemAnnouncementRead)
class SystemAnnouncementReadAdmin(admin.ModelAdmin):
    list_display = ("announcement", "store_user", "read_at")
    list_filter = ("read_at",)
    search_fields = ("announcement__title", "store_user__display_name")
