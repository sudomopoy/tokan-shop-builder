
from django import forms

class ColorPickerWidget(forms.TextInput):
    input_type = 'color'

    def __init__(self, attrs=None):
        self.attrs = {'type': 'color'}
        if attrs:
            self.attrs.update(attrs)


