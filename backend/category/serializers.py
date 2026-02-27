# category/serializers.py
from rest_framework import serializers
from .models import Category
from media.serializers import MediaSerializer
from media.models import Media

class CategoryTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    icon = MediaSerializer(read_only=True)
    icon_id = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(),
        source='icon',
        write_only=True,
        required=False,
        allow_null=True
    )
    icon_url = serializers.SerializerMethodField()
    icon_svg = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'module',
            'parent',
            'icon',
            'icon_id',
            'icon_type',
            'default_icon',
            'icon_color',
            'icon_url',
            'icon_svg',
            'children',
            'is_editable',
            'created_at',
            'updated_at',
        ]
        extra_kwargs = {
            'parent': {'read_only': True},
            'slug': {'read_only': True},
        }
    
    def get_icon_url(self, obj):
        return obj.get_icon_url()
    
    def get_icon_svg(self, obj):
        return obj.get_icon_svg()

    def get_children(self, obj):
        # Only include children belonging to the same store
        children = obj.get_children().filter(store=obj.store)
        return CategoryTreeSerializer(children, many=True, context=self.context).data


class CategoryCreateUpdateSerializer(serializers.ModelSerializer):
    icon_id = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(),
        source='icon',
        write_only=True,
        required=False,
        allow_null=True
    )
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='parent',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'module',
            'parent_id',
            'icon_id',
            'icon_type',
            'default_icon',
            'icon_color',
            'is_editable',
        ]
        extra_kwargs = {
            'slug': {'read_only': True},
        }

    def validate(self, data):
        if 'parent' in data and data['parent']:
            parent = data['parent']
            # Store must match current request store
            request = self.context.get('request')
            if request is not None and hasattr(request, 'store'):
                if parent.store_id != request.store.id:
                    raise serializers.ValidationError({'parent': 'Parent category must belong to the same store'})
        return data


class CategorySerializer(serializers.ModelSerializer):
    icon = MediaSerializer(read_only=True)
    parent = serializers.StringRelatedField()
    children_count = serializers.SerializerMethodField()
    icon_url = serializers.SerializerMethodField()
    icon_svg = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'

    def get_children_count(self, obj):
        return obj.get_children().filter(store=obj.store).count()
    
    def get_icon_url(self, obj):
        return obj.get_icon_url()
    
    def get_icon_svg(self, obj):
        return obj.get_icon_svg()