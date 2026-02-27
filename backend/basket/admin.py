from django.contrib import admin
from .models import Basket, BasketItem

class BasketItemInline(admin.TabularInline):
    model = BasketItem
    extra = 0

@admin.register(Basket)
class BasketAdmin(admin.ModelAdmin):
    list_display = ("store_user", "store", "total_items", "total_price", "created_at")
    inlines = [BasketItemInline]
