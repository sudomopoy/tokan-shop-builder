from django.contrib import admin
from .models import Province, City
from unfold.admin import ModelAdmin
from import_export.admin import ImportExportModelAdmin


@admin.register(Province)
class ProvinceAdmin( ImportExportModelAdmin):
    list_display = ("id", "name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(City)
class CityAdmin( ImportExportModelAdmin):
    list_display = ("id", "name", "slug", "province")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    list_filter = ("province",)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("province")
