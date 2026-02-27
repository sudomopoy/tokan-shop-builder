from django.contrib import admin
from .models import Media

from unfold.admin import ModelAdmin
from import_export.admin import ImportExportModelAdmin
@admin.register(Media)
class MediaAdmin(ImportExportModelAdmin):
    search_fields = ["title", "original_filename", "description"]
