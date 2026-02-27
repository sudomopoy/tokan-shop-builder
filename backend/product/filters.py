from django_filters import rest_framework as filters
from .models import Product
from category.models import Category
from tag.models import Tag

class ProductFilter(filters.FilterSet):
    categories = filters.ModelMultipleChoiceFilter(
        queryset=Category.objects.all(),
        field_name='categories',
        required=False,
    )
    created_at = filters.DateFromToRangeFilter(
        required=False,
    )
    in_stock = filters.BooleanFilter(method='filter_in_stock', required=False)

    @staticmethod
    def filter_in_stock(queryset, name, value):
        if value in (True, "true", "1", 1):
            from django.db.models import Q
            return queryset.filter(Q(stock_unlimited=True) | Q(stock__gt=0))
        return queryset

    class Meta:
        model = Product
        fields = ['categories', 'created_at', 'in_stock']