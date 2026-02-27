from django.contrib import admin
from django.utils.html import format_html
from .models import (
    SubscriptionPlan,
    SubscriptionPlanDuration,
    SubscriptionDiscountCode,
    SubscriptionPayment,
)


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "level",
        "is_active",
        "is_default",
        "max_admins",
        "max_products",
        "max_ai_questions_per_day",
        "store_plan",
    ]
    list_filter = ["is_active", "is_default"]
    search_fields = ["title"]


@admin.register(SubscriptionPlanDuration)
class SubscriptionPlanDurationAdmin(admin.ModelAdmin):
    list_display = ["plan", "duration_months", "base_price", "discount_percent", "final_price_display", "is_active"]
    list_filter = ["plan", "is_active"]

    def final_price_display(self, obj):
        return f"{obj.final_price:,.0f} تومان"

    final_price_display.short_description = "قیمت نهایی"


@admin.register(SubscriptionDiscountCode)
class SubscriptionDiscountCodeAdmin(admin.ModelAdmin):
    list_display = [
        "code",
        "discount_type",
        "discount_value",
        "used_count",
        "max_uses",
        "is_active",
        "valid_until",
    ]
    list_filter = ["discount_type", "is_active"]
    search_fields = ["code"]


@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = ["store", "plan", "duration_months", "amount", "status", "created_at"]
    list_filter = ["status"]
    readonly_fields = ["created_at", "updated_at"]
