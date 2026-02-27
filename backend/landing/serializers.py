from rest_framework import serializers
from .models import SupportRequest


class SupportRequestSerializer(serializers.ModelSerializer):
    """سریالایزر درخواست پشتیبانی - بدون auth"""

    type = serializers.CharField(
        source="business_type",
        required=False,
        allow_blank=True,
        default="",
    )

    class Meta:
        model = SupportRequest
        fields = ["name", "phone", "type", "message", "source"]
        extra_kwargs = {
            "name": {"required": True},
            "phone": {"required": True},
            "message": {"required": False, "allow_blank": True},
            "source": {"required": False, "default": "landing"},
        }
