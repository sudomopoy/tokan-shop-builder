from django.contrib import admin
from .models import Slider, Slide
from unfold.admin import ModelAdmin
from import_export.admin import ImportExportModelAdmin


@admin.register(Slider)
class SliderAdmin( ImportExportModelAdmin):
    pass


@admin.register(Slide)
class SlideAdmin( ImportExportModelAdmin):
    pass
