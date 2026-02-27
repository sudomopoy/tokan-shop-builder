from rest_framework import serializers
from .models import SystemAnnouncement, SystemAnnouncementRead


class SystemAnnouncementSerializer(serializers.ModelSerializer):
    read = serializers.SerializerMethodField()
    read_at = serializers.SerializerMethodField()

    class Meta:
        model = SystemAnnouncement
        fields = [
            "id",
            "title",
            "message",
            "notification_type",
            "source",
            "link",
            "created_at",
            "read",
            "read_at",
        ]

    def get_read(self, obj):
        request = self.context.get("request")
        if not request or not hasattr(request, "store_user"):
            return False
        return SystemAnnouncementRead.objects.filter(
            announcement=obj,
            store_user=request.store_user,
        ).exists()

    def get_read_at(self, obj):
        request = self.context.get("request")
        if not request or not hasattr(request, "store_user"):
            return None
        read = SystemAnnouncementRead.objects.filter(
            announcement=obj,
            store_user=request.store_user,
        ).first()
        return read.read_at.isoformat() if read else None
