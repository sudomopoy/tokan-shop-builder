# The above code defines serializers for Slide and Slider models in Django, including a custom method
# to retrieve active slides for a slider.
from slider.models import Slider, Slide
from rest_framework import serializers
from media.serializers import MediaSerializer


class SlideSerializer(serializers.ModelSerializer):
    desktop_image = MediaSerializer(read_only=True)
    mobile_image = MediaSerializer(allow_null=True, read_only=True)

    class Meta:
        model = Slide
        fields = [
            "id",
            "store",
            "slider",
            "title",
            "alt",
            "description",
            "url",
            "button_text",
            "show_button",
            "index",
            "is_active",
            "desktop_image",
            "mobile_image",
            "created_at",
            "updated_at",
        ]


class SlideCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slide
        fields = [
            "slider",
            "title",
            "alt",
            "description",
            "url",
            "button_text",
            "show_button",
            "index",
            "is_active",
            "desktop_image",
            "mobile_image",
        ]


class SliderSerializer(serializers.ModelSerializer):
    active_slides = SlideSerializer(many=True, read_only=True)

    class Meta:
        model = Slider
        fields = [
            "id",
            "store",
            "title",
            "is_active",
            "active_slides",
            "created_at",
            "updated_at",
        ]


class SliderListSerializer(serializers.ModelSerializer):
    slides_count = serializers.SerializerMethodField()

    class Meta:
        model = Slider
        fields = [
            "id",
            "title",
            "is_active",
            "slides_count",
            "created_at",
            "updated_at",
        ]

    def get_slides_count(self, obj):
        return getattr(obj, "_slides_count", obj.slides.count())


class SliderCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slider
        fields = ["title", "is_active"]


class SliderDetailSerializer(serializers.ModelSerializer):
    slides = SlideSerializer(many=True, read_only=True)

    class Meta:
        model = Slider
        fields = [
            "id",
            "store",
            "title",
            "is_active",
            "slides",
            "created_at",
            "updated_at",
        ]
