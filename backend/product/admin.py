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
