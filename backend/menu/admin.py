from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from .models import Menu, MenuItem


@admin.register(Menu)
class MenuAdmin(ImportExportModelAdmin):
    list_display = ["title", "key", "store", "is_primary", "is_active", "created_at"]
    list_filter = ["is_primary", "is_active", "store"]
    search_fields = ["title", "key", "description"]
    raw_id_fields = ["store"]


@admin.register(MenuItem)
class MenuItemAdmin(ImportExportModelAdmin):
    list_display = [
        "menu",
        "title",
        "item_type",
        "status",
        "index",
        "parent",
    ]
    list_filter = ["item_type", "status", "menu__store"]
    search_fields = ["title", "url", "menu__title"]
    raw_id_fields = ["menu", "parent", "category", "product", "page"]
    ordering = ["menu", "parent", "index"]
