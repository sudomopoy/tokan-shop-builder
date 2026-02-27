# widgets.py
from django import forms
from django.utils.html import format_html
from .default_icons import DEFAULT_CATEGORY_ICONS, ICON_CHOICES

class IconSelectionWidget(forms.RadioSelect):
    """Custom widget for icon selection with visual preview"""
    
    def render(self, name, value, attrs=None, renderer=None):
        if value is None:
            value = ''
        
        output = []
        output.append('<div class="icon-selection">')
        
        for choice_value, choice_label in self.choices:
            icon_svg = DEFAULT_CATEGORY_ICONS.get(choice_value, '')
            is_selected = str(value) == str(choice_value)
            
            output.append(format_html(
                '<div class="icon-option {}">'
                '<input type="radio" name="{}" value="{}" id="id_{}_{}" {}>'
                '<label for="id_{}_{}">'
                '{}'
                '<br>{}'
                '</label>'
                '</div>',
                'selected' if is_selected else '',
                name,
                choice_value,
                name,
                choice_value,
                'checked' if is_selected else '',
                name,
                choice_value,
                icon_svg,
                choice_label
            ))
        
        output.append('</div>')
        return format_html(''.join(output))
    
    class Media:
        css = {
            'all': ('admin/css/category_admin.css',)
        }
        js = ('admin/js/category_admin.js',)

class IconTypeWidget(forms.RadioSelect):
    """Custom widget for icon type selection"""
    
    def render(self, name, value, attrs=None, renderer=None):
        if value is None:
            value = ''
        
        output = []
        output.append('<div class="icon-type-selection">')
        
        for choice_value, choice_label in self.choices:
            is_selected = str(value) == str(choice_value)
            
            output.append(format_html(
                '<div class="icon-type-option {}">'
                '<input type="radio" name="{}" value="{}" id="id_{}_{}" {}>'
                '<label for="id_{}_{}">{}</label>'
                '</div>',
                'selected' if is_selected else '',
                name,
                choice_value,
                name,
                choice_value,
                'checked' if is_selected else '',
                name,
                choice_value,
                choice_label
            ))
        
        output.append('</div>')
        return format_html(''.join(output))


