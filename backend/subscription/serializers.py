from rest_framework import serializers
from .models import (
    SubscriptionPlan,
    SubscriptionPlanDuration,
    SubscriptionDiscountCode,
    SubscriptionPayment,
)


class SubscriptionPlanDurationSerializer(serializers.ModelSerializer):
    final_price = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlanDuration
        fields = [
            "id",
            "duration_months",
            "base_price",
            "discount_percent",
            "final_price",
            "is_active",
        ]

    def get_final_price(self, obj):
        return float(obj.final_price)


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    durations = SubscriptionPlanDurationSerializer(many=True, read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "title",
            "description",
            "level",
            "is_active",
            "is_default",
            "max_products",
            "durations",
        ]


class SubscriptionPlanListSerializer(serializers.ModelSerializer):
    """خلاصه پلن برای لیست"""

    class Meta:
        model = SubscriptionPlan
        fields = ["id", "title", "level", "max_products"]


class SubscriptionStatusSerializer(serializers.Serializer):
    """وضعیت اشتراک فروشگاه"""
    subscription_expires_at = serializers.DateTimeField(allow_null=True)
    subscription_days_remaining = serializers.IntegerField(allow_null=True)
    subscription_plan = SubscriptionPlanListSerializer(allow_null=True)
    is_expired = serializers.BooleanField()
    is_expired_over_10_days = serializers.BooleanField()


class SubscriptionPaymentListSerializer(serializers.ModelSerializer):
    plan_title = serializers.CharField(source="plan.title", read_only=True)

    class Meta:
        model = SubscriptionPayment
        fields = [
            "id",
            "created_at",
            "plan",
            "plan_title",
            "duration_months",
            "amount",
            "status",
        ]


class RenewSubscriptionSerializer(serializers.Serializer):
    plan_id = serializers.UUIDField()
    duration_months = serializers.IntegerField(min_value=1)
    discount_code = serializers.CharField(required=False, allow_blank=True)
    wallet_amount = serializers.IntegerField(required=False, default=0, min_value=0)
