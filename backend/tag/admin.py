from django.contrib import admin
from .models import *

from unfold.admin import ModelAdmin
from import_export.admin import ImportExportModelAdmin
@admin.register(Tag)
class TagAdmin(ImportExportModelAdmin):
    pass
