from django.contrib import admin
from unfold.admin import ModelAdmin
from import_export.admin import ImportExportModelAdmin
from .models import (
    Theme,
    ThemeCategory,
    ThemeTag,
    ThemeGalleryImage,
    Page,
    WidgetType,
    WidgetStyle,
    Widget,
    WidgetTemplate,
)


@admin.register(ThemeCategory)
class ThemeCategoryAdmin(ImportExportModelAdmin):
    list_display = ["name", "slug", "order", "created_at"]
    search_fields = ["name", "slug"]
    ordering = ["order", "name"]


@admin.register(ThemeTag)
class ThemeTagAdmin(ImportExportModelAdmin):
    list_display = ["name", "slug", "created_at"]
    search_fields = ["name", "slug"]


class ThemeGalleryImageInline(admin.TabularInline):
    model = ThemeGalleryImage
    extra = 0
    autocomplete_fields = ["media"]


@admin.register(Theme)
class ThemeAdmin(ImportExportModelAdmin):
    list_display = ["name", "slug", "category", "is_paid", "price", "is_active", "is_public", "created_at"]
    list_filter = ["is_active", "is_public", "is_paid", "category"]
    search_fields = ["name", "slug", "description"]
    filter_horizontal = ["tags"]
    raw_id_fields = ["thumbnail"]
    inlines = [ThemeGalleryImageInline]


@admin.register(Page)
class PageAdmin(ImportExportModelAdmin):
    list_display = ["path", "store", "title", "is_active", "created_at"]
    list_filter = ["is_active", "store"]
    search_fields = ["path", "title", "description", "meta_title"]
    raw_id_fields = ["store"]


@admin.register(WidgetType)
class WidgetTypeAdmin(ImportExportModelAdmin):
    list_display = ["name", "is_layout", "icon", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "description"]
    raw_id_fields = ["thumbnail"]


@admin.register(WidgetStyle)
class WidgetStyleAdmin(ImportExportModelAdmin):
    list_display = ["widget_type", "name", "key", "order", "is_active", "created_at"]
    list_filter = ["is_active", "widget_type"]
    search_fields = ["name", "key", "widget_type__name"]
    raw_id_fields = ["widget_type", "preview_image"]
    ordering = ["widget_type", "order", "name"]


@admin.register(Widget)
class WidgetAdmin(ImportExportModelAdmin):
    list_display = ["page", "widget_type","widget_config", "index","is_active"]
    list_filter = ["is_active","page__store"]
    search_fields = ["page__path", "widget_type__name"]
    raw_id_fields = ["page", "widget_type"]
    ordering = ["page", "index"]


@admin.register(WidgetTemplate)
class WidgetTemplateAdmin(ImportExportModelAdmin):
    list_display = ["name", "widget_type", "is_active", "is_public", "created_at"]
    list_filter = ["is_active", "is_public"]
    search_fields = ["name", "description", "widget_type__name"]
    raw_id_fields = ["widget_type", "thumbnail"]
