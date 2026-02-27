from django_filters import rest_framework as filters
from .models import Article, STATUS_CHOICES
from category.models import Category
from tag.models import Tag

class ArticleFilter(filters.FilterSet):
    module = filters.CharFilter(field_name='module', required=False)
    status = filters.MultipleChoiceFilter(
        choices=STATUS_CHOICES,
        field_name='status',
        required=False,
    )
    categories = filters.ModelMultipleChoiceFilter(
        queryset=Category.objects.all(),
        field_name='category',
        required=False,
    )
    tags = filters.ModelMultipleChoiceFilter(
        queryset=Tag.objects.all(),
        field_name='tags',
        required=False,
    )
    created_at = filters.DateFromToRangeFilter(
        required=False,
    )

    class Meta:
        model = Article
        fields = ['module', 'status', 'categories', 'tags', 'created_at']