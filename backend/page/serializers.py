from rest_framework import serializers
from django.conf import settings
from .models import Page, Widget, WidgetType, Theme, WidgetStyle
from .widget_builder_catalog import (
    get_default_payload,
    get_style_presets,
    get_visual_schema,
    get_widget_icon,
)


class WidgetConfigSerializer(serializers.Serializer):
    """
    Serializer for widget configuration matching frontend WidgetConfig type
    """
    index = serializers.IntegerField()
    widget = serializers.CharField()
    componentsConfig = serializers.JSONField(required=False)
    extraRequestParams = serializers.JSONField(required=False)
    widgetConfig = serializers.JSONField(required=False)


class LayoutConfigSerializer(serializers.Serializer):
    """
    Serializer for layout configuration
    """
    index = serializers.IntegerField()
    widget = serializers.CharField()


class PageConfigSerializer(serializers.Serializer):
    """
    Serializer for page configuration matching frontend PageConfig type
    """
    page = serializers.CharField()
    layout = LayoutConfigSerializer(allow_null=True)
    content = WidgetConfigSerializer(many=True)


class PageSerializer(serializers.ModelSerializer):
    """
    Full serializer for Page model with nested widget configuration
    """
    class Meta:
        model = Page
        fields = ['id', 'path', 'title', 'description', 'is_active', 
                  'meta_title', 'meta_description', 'meta_keywords']

    def _merge_path_params(self, widget_config, path_params):
        """Merge path_params into widgetConfig for widget access."""
        merged = dict(widget_config) if widget_config else {}
        if path_params:
            merged['pathParams'] = path_params
            # Also spread top-level for convenience (id, slug etc.)
            for k, v in path_params.items():
                if k not in merged:
                    merged[k] = v
        return merged if merged else None

    def to_representation(self, instance):
        """
        Convert Page instance to PageConfig format
        """
        path_params = self.context.get('path_params', {})
        path_params_serializable = {k: v for k, v in path_params.items()}

        layout_widget = instance.widgets.filter(widget_type__is_layout=True, is_active=True).first()
        content_widgets = instance.widgets.filter(widget_type__is_layout=False, is_active=True).order_by('index')
        
        # Build layout config
        layout_config = None
        if layout_widget:
            layout_config = {
                'index': layout_widget.index,
                'widget': layout_widget.widget_type.name,
            }
            if layout_widget.widget_config:
                layout_config["widgetConfig"] = self._merge_path_params(
                    layout_widget.widget_config, path_params_serializable
                )
            elif path_params_serializable:
                layout_config["widgetConfig"] = {
                    'pathParams': path_params_serializable,
                    **path_params_serializable,
                }
            if layout_widget.components_config:
                layout_config["componentsConfig"] = layout_widget.components_config
            if layout_widget.extra_request_params:
                layout_config["extraRequestParams"] = layout_widget.extra_request_params
        
        # Build content configs
        content_configs = []
        for widget in content_widgets:
            widget_config = {
                'index': widget.index,
                'widget': widget.widget_type.name,
            }
            
            if widget.components_config:
                widget_config['componentsConfig'] = widget.components_config
            
            if widget.extra_request_params:
                widget_config['extraRequestParams'] = widget.extra_request_params

            if widget.widget_config:
                widget_config['widgetConfig'] = self._merge_path_params(
                    widget.widget_config, path_params_serializable
                )
            elif path_params_serializable:
                widget_config['widgetConfig'] = {
                    'pathParams': path_params_serializable,
                    **path_params_serializable,
                }
            
            content_configs.append(widget_config)
        
        request_path = self.context.get('request_path')
        result = {
            # Management-friendly fields (safe additive change for storefront).
            'id': instance.id,
            'path': instance.path,
            'isActive': instance.is_active,
            'page': request_path if request_path else instance.path,
            'title': instance.title,
            'description': instance.description,
            'metaTitle': instance.meta_title,
            'metaDescription': instance.meta_description,
            'metaKeywords': instance.meta_keywords,
            'layout': layout_config,
            'content': content_configs,
        }
        if path_params_serializable:
            result['pathParams'] = path_params_serializable
        return result


class ThemeSerializer(serializers.ModelSerializer):
    """Serializer for Theme catalog (store settings - theme selection)"""
    thumbnail_url = serializers.SerializerMethodField()
    slug_display = serializers.SerializerMethodField()
    gallery_expanded = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()

    class Meta:
        model = Theme
        fields = [
            "id",
            "name",
            "slug",
            "slug_display",
            "description",
            "thumbnail",
            "thumbnail_url",
            "gallery_expanded",
            "tags",
            "category",
            "is_paid",
            "price",
            "demo_url",
            "is_active",
        ]

    def get_slug_display(self, obj):
        return obj.slug or obj.name.lower().replace(" ", "-") if obj.name else None

    def _file_to_url(self, file_field):
        """Convert FileField/FieldFile to URL string."""
        if not file_field:
            return None
        url = getattr(file_field, "url", None) or getattr(file_field, "name", None) or str(file_field)
        if not url:
            return None
        if not isinstance(url, str):
            url = str(url)
        if url.startswith(("http://", "https://")):
            return url
        base = getattr(settings, "API_URL_BASE", "") or ""
        return f"{base.rstrip('/')}/{url.lstrip('/')}" if base else url

    def get_thumbnail_url(self, obj):
        if obj.thumbnail and obj.thumbnail.file:
            return self._file_to_url(obj.thumbnail.file)
        return None

    def get_category(self, obj):
        """Return category name for API compatibility (frontend expects string)."""
        return obj.category.name if obj.category else None

    def get_tags(self, obj):
        """Return list of tag names for API compatibility."""
        if hasattr(obj, "_prefetched_objects_cache") and "tags" in obj._prefetched_objects_cache:
            return [t.name for t in obj.tags.all()]
        return list(obj.tags.values_list("name", flat=True))

    def get_gallery_expanded(self, obj):
        """Build gallery from ThemeGalleryImage relations."""
        gallery_images = []
        if hasattr(obj, "_prefetched_objects_cache") and "gallery_images" in obj._prefetched_objects_cache:
            gallery_images = obj.gallery_images.all()
        elif hasattr(obj, "gallery_images"):
            gallery_images = obj.gallery_images.select_related("media").order_by("order")
        result = []
        for gi in gallery_images:
            url = None
            if gi.media and gi.media.file:
                url = self._file_to_url(gi.media.file)
            result.append({
                "media_id": str(gi.media_id) if gi.media_id else None,
                "url": url,
                "description": gi.description or "",
            })
        return result


class WidgetStyleSerializer(serializers.ModelSerializer):
    preview_url = serializers.SerializerMethodField()

    class Meta:
        model = WidgetStyle
        fields = [
            "id",
            "key",
            "name",
            "description",
            "preview_image",
            "preview_url",
            "order",
            "is_active",
            "default_widget_config",
            "default_components_config",
            "default_extra_request_params",
        ]

    def _file_to_url(self, file_field):
        if not file_field:
            return None
        url = getattr(file_field, "url", None) or getattr(file_field, "name", None) or str(file_field)
        if not url:
            return None
        if not isinstance(url, str):
            url = str(url)
        if url.startswith(("http://", "https://")):
            return url
        base = getattr(settings, "API_URL_BASE", "") or ""
        return f"{base.rstrip('/')}/{url.lstrip('/')}" if base else url

    def get_preview_url(self, obj):
        if obj.preview_image and obj.preview_image.file:
            return self._file_to_url(obj.preview_image.file)
        return None


class WidgetTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for WidgetType model
    """
    theme_name = serializers.CharField(source='theme.name', read_only=True)
    icon = serializers.SerializerMethodField()
    visual_schema = serializers.SerializerMethodField()
    style_presets = serializers.SerializerMethodField()
    default_payload = serializers.SerializerMethodField()
    
    class Meta:
        model = WidgetType
        fields = [
            'id',
            'name',
            'is_layout',
            'description',
            'theme',
            'theme_name',
            'thumbnail',
            'icon',
            'visual_schema',
            'default_payload',
            'style_presets',
            'is_active',
        ]

    def get_icon(self, obj):
        return obj.icon or get_widget_icon(obj.name)

    def get_visual_schema(self, obj):
        if obj.visual_schema:
            return obj.visual_schema
        return get_visual_schema(obj.name)

    def get_default_payload(self, obj):
        payload = get_default_payload(obj.name)
        if obj.default_widget_config:
            payload["widget_config"] = obj.default_widget_config
        if obj.default_components_config:
            payload["components_config"] = obj.default_components_config
        if obj.default_extra_request_params:
            payload["extra_request_params"] = obj.default_extra_request_params
        return payload

    def get_style_presets(self, obj):
        if hasattr(obj, "_prefetched_objects_cache") and "styles" in obj._prefetched_objects_cache:
            styles = sorted(
                [s for s in obj.styles.all() if s.is_active],
                key=lambda s: (s.order, s.name),
            )
        else:
            styles = list(obj.styles.filter(is_active=True).order_by("order", "name"))
        if styles:
            return WidgetStyleSerializer(styles, many=True, context=self.context).data
        return get_style_presets(obj.name)


class WidgetSerializer(serializers.ModelSerializer):
    """
    Serializer for Widget model
    """
    widget_type_name = serializers.CharField(source='widget_type.name', read_only=True)
    
    class Meta:
        model = Widget
        fields = ['id', 'page','widget_config', 'widget_type', 'widget_type_name', 'index', 
                'is_active', 'components_config', 'extra_request_params']
