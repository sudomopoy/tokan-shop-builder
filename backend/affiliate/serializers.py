from rest_framework import serializers
from .models import AffiliateInvite, AffiliateEarning, AffiliateConfig


class AffiliateInviteSerializer(serializers.ModelSerializer):
    invitee_mobile = serializers.CharField(source="invitee.mobile", read_only=True)
    invitee_username = serializers.CharField(source="invitee.username", read_only=True)
    total_earnings = serializers.SerializerMethodField()
    total_purchases = serializers.SerializerMethodField()
    commission_percent_display = serializers.SerializerMethodField()
    expires_at_display = serializers.SerializerMethodField()
    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = AffiliateInvite
        fields = (
            "id", "created_at", "invitee_mobile", "invitee_username",
            "commission_percent_display", "expires_at_display",
            "total_earnings", "total_purchases", "is_valid",
        )
        read_only_fields = fields

    def get_total_earnings(self, obj):
        from django.db.models import Sum
        return AffiliateEarning.objects.filter(invite=obj, status="completed").aggregate(
            s=Sum("commission_amount")
        )["s"] or 0

    def get_total_purchases(self, obj):
        from django.db.models import Sum
        return AffiliateEarning.objects.filter(invite=obj).aggregate(
            s=Sum("purchase_amount")
        )["s"] or 0

    def get_commission_percent_display(self, obj):
        return f"{obj.get_commission_percent():.1f}%"

    def get_expires_at_display(self, obj):
        return obj.get_expires_at().isoformat() if obj.get_expires_at() else None

    def get_is_valid(self, obj):
        return obj.is_valid_for_commission()


class AffiliateEarningSerializer(serializers.ModelSerializer):
    order_code = serializers.SerializerMethodField()
    invitee_mobile = serializers.SerializerMethodField()

    class Meta:
        model = AffiliateEarning
        fields = (
            "id", "created_at", "purchase_amount", "commission_amount",
            "commission_percent", "status", "order_code", "invitee_mobile",
            "description", "completed_at",
        )

    def get_order_code(self, obj):
        return obj.order.code if obj.order else None

    def get_invitee_mobile(self, obj):
        return obj.invite.invitee.mobile if obj.invite else None


class AffiliateConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AffiliateConfig
        fields = ("default_commission_percent", "default_duration_months")
