# forms.py
from django import forms
from django.contrib.auth.forms import AuthenticationForm
from store.models import Store


class StoreLoginForm(AuthenticationForm):
    store = forms.ModelChoiceField(
        queryset=Store.objects.all(), required=True, label="فروشگاه"
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["store"].widget.attrs.update({"class": "form-control"})
