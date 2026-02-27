from django.contrib import admin
from .models import ProductReview


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ["product", "store_user", "rating", "status", "created_at"]
    list_filter = ["status", "rating"]
    search_fields = ["body", "product__title", "store_user__display_name"]
    readonly_fields = ["created_at", "updated_at", "approved_at"]
    raw_id_fields = ["product", "store_user", "approved_by"]
