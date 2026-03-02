from django.contrib import admin
from django import forms
from .models import *
from unfold.admin import ModelAdmin
from import_export.admin import ImportExportModelAdmin
from .form import ProductJSONWidget


@admin.register(Variant)
class VariantAdmin( ImportExportModelAdmin):
    pass


@admin.register(VariantAttribute)
class VariantAttributeAdmin(ImportExportModelAdmin):
    search_fields = ["title", "slug"]


@admin.register(VariantAttributeValue)
class VariantAttributeValueAdmin(ImportExportModelAdmin):
    search_fields = ["title", "code"]
    list_filter = ["attribute"]


@admin.register(VariantAttributeSelection)
class VariantAttributeSelectionAdmin(ImportExportModelAdmin):
    list_filter = ["attribute"]


class ProductAdminForm(forms.ModelForm):
    class Meta:
        widgets = {
            "information": ProductJSONWidget(),
        }


@admin.register(Product)
class ProductAdmin( ImportExportModelAdmin):
    search_fields = ["title", "code"]
    form = ProductAdminForm


@admin.register(ProductGroupPrice)
class ProductGroupPriceAdmin(ImportExportModelAdmin):
    list_display = ["product", "variant", "customer_group", "sell_price", "is_active"]
    list_filter = ["is_active", "customer_group"]
    search_fields = ["product__title", "customer_group__name"]


@admin.register(ProductTierDiscount)
class ProductTierDiscountAdmin(ImportExportModelAdmin):
    list_display = [
        "product",
        "customer_group",
        "min_quantity",
        "max_quantity",
        "discount_percent",
        "is_active",
    ]
    list_filter = ["is_active", "customer_group"]
    search_fields = ["product__title", "customer_group__name"]


@admin.register(StoreCartTierDiscount)
class StoreCartTierDiscountAdmin(ImportExportModelAdmin):
    list_display = [
        "store",
        "criterion",
        "min_value",
        "max_value",
        "discount_percent",
        "customer_group",
        "is_active",
    ]
    list_filter = ["criterion", "is_active", "customer_group"]


@admin.register(InventoryAdjustmentLog)
class InventoryAdjustmentLogAdmin(ImportExportModelAdmin):
    list_display = [
        "product",
        "variant",
        "reason",
        "quantity_before",
        "quantity_after",
        "quantity_change",
        "created_at",
    ]
    list_filter = ["reason", "created_at"]
    search_fields = ["product__title", "variant__id", "note"]
