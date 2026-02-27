from django.contrib import admin
from django.utils.html import format_html
from django import forms
from .models import *
from .default_icons import DEFAULT_CATEGORY_ICONS, ICON_CHOICES
from .widgets import IconSelectionWidget, IconTypeWidget
from import_export.admin import ImportExportModelAdmin 
from unfold.admin import ModelAdmin

class CategoryAdminForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = '__all__'
        widgets = {
            'icon_type': IconTypeWidget(choices=[
                ('default', 'آیکون پیش‌فرض'),
                ('uploaded', 'آیکون آپلود شده')
            ]),
            'default_icon': IconSelectionWidget(choices=ICON_CHOICES),
        }

@admin.register(Category)
class CategoryAdmin(ImportExportModelAdmin):
    form = CategoryAdminForm
    list_display = ['name', 'icon_type', 'default_icon',  'parent', 'is_editable']
    list_filter = ['icon_type', 'module', 'is_editable', 'created_at']
    search_fields = ['name', 'slug']
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('store', 'name', 'slug', 'module', 'parent', 'is_editable')
        }),
        ('آیکون', {
            'fields': ('icon_type', 'default_icon', 'icon'),
            'description': 'انتخاب نوع آیکون: پیش‌فرض یا آپلود شده'
        }),
    )
    
    def icon_preview(self, obj):
        """Show icon preview in admin list"""
        if obj.icon_type == 'uploaded' and obj.icon:
            return format_html(
                '<img src="{}" style="width: 24px; height: 24px; object-fit: contain;" />',
                obj.icon.file.url
            )
        elif obj.icon_type == 'default' and obj.default_icon:
            svg_content = DEFAULT_CATEGORY_ICONS.get(obj.default_icon, '')
            if svg_content:
                return format_html(
                    '<div style="width: 24px; height: 24px; display: inline-block;">{}</div>',
                    svg_content
                )
        return '-'
    icon_preview.short_description = 'پیش‌نمایش آیکون'
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        
        # Add custom CSS and JavaScript for better icon selection
        class Media:
            css = {
                'all': ('admin/css/category_admin.css',)
            }
            js = ('admin/js/category_admin.js',)
        
        form.Media = Media
        return form

