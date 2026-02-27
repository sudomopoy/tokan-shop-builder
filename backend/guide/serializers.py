from rest_framework import serializers
from .models import PageGuide


class PageGuideSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageGuide
        fields = ["id", "path", "video_desktop", "video_mobile", "description"]
        read_only_fields = fields


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000)
    path = serializers.CharField(max_length=500, default="/")
    conversation_history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
    )


class ChatResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
    success = serializers.BooleanField()
