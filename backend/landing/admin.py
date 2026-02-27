from django.contrib import admin
from .models import SupportRequest


@admin.register(SupportRequest)
class SupportRequestAdmin(admin.ModelAdmin):
    list_display = ["name", "phone", "business_type", "source", "created_at"]
    list_filter = ["source", "business_type"]
    search_fields = ["name", "phone", "message"]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]
