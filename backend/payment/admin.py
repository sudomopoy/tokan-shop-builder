from django.contrib import admin
from .models import *
from unfold.admin import ModelAdmin
from import_export.admin import ImportExportModelAdmin


@admin.register(PaymentGatewayType)
class PaymentGatewayTypeAdmin(ImportExportModelAdmin):
    list_display = ("id", "name", "title", "has_sandbox")
    list_filter = ("has_sandbox",)


@admin.register(Payment)
class PaymentAdmin(ImportExportModelAdmin):
    pass


@admin.register(PaymentGateway)
class PaymentGatewayAdmin(ImportExportModelAdmin):
    list_display = ('id', 'title', 'gateway_type', 'store', 'is_sandbox')
    list_filter = ('is_sandbox', 'gateway_type')