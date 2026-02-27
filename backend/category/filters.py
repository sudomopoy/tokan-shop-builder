from django_filters import rest_framework as filters
from .models import Category


class CategoryFilter(filters.FilterSet):
    parent__isnull = filters.BooleanFilter(field_name='parent', lookup_expr='isnull')

    class Meta:
        model = Category
        fields = ['module', 'parent', 'parent__isnull']
