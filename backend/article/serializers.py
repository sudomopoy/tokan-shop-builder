from rest_framework import serializers
from .models import Article
from tag.models import Tag
from media.models import Media
from category.models import Category
from core.i18n import localize_value


class ArticleCategorySerializer(serializers.ModelSerializer):
    """Minimal category for article display."""
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class ArticleImageSerializer(serializers.ModelSerializer):
    """Minimal serializer for article images - returns id and file URL."""
    class Meta:
        model = Media
        fields = ['id', 'file']


class ArticleSerializer(serializers.ModelSerializer):
    tags = serializers.PrimaryKeyRelatedField(queryset=Tag.objects.all(), many=True, required=False)
    main_image = ArticleImageSerializer(read_only=True)
    thumbnail_image = ArticleImageSerializer(read_only=True)
    category = ArticleCategorySerializer(read_only=True)
    main_image_id = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(), required=False, allow_null=True, write_only=True
    )
    thumbnail_image_id = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(), required=False, allow_null=True, write_only=True
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), required=False, allow_null=True, write_only=True
    )

    class Meta:
        model = Article
        fields = [
            'id',
            'module',
            'title',
            'slug',
            'description',
            'main_image',
            'thumbnail_image',
            'main_image_id',
            'thumbnail_image_id',
            'category',
            'category_id',
            'status',
            'created_at',
            'updated_at',
            'tags',
            'meta_title',
            'meta_description',
            'meta_keywords',
            'canonical_url',
            'robots_meta',
            'schema_markup',
            'extra_data',
            'total_views',
        ]

        read_only_fields = ['total_views']

    def create(self, validated_data):
        main_image = validated_data.pop('main_image_id', None)
        thumbnail_image = validated_data.pop('thumbnail_image_id', None)
        category = validated_data.pop('category_id', None)
        article = Article.objects.create(
            main_image=main_image,
            thumbnail_image=thumbnail_image,
            category=category,
            **validated_data
        )
        return article

    def update(self, instance, validated_data):
        if 'main_image_id' in validated_data:
            instance.main_image = validated_data.pop('main_image_id')
        if 'thumbnail_image_id' in validated_data:
            instance.thumbnail_image = validated_data.pop('thumbnail_image_id')
        if 'category_id' in validated_data:
            instance.category = validated_data.pop('category_id')
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return localize_value(data)
