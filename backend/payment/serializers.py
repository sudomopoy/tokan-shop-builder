from rest_framework import serializers
from .models import PaymentGatewayType, PaymentGateway


class PaymentGatewayTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentGatewayType
        fields = ("id", "name", "title", "has_sandbox", "config_schema")


class PaymentGatewaySerializer(serializers.ModelSerializer):
    gateway_type = PaymentGatewayTypeSerializer(read_only=True)

    class Meta:
        model = PaymentGateway
        fields = ("id", "title", "gateway_type", "logo", "configuration", "is_sandbox")


class PaymentGatewayUpdateSerializer(serializers.ModelSerializer):
    """For PATCH: store can update title, logo, configuration, is_sandbox."""

    class Meta:
        model = PaymentGateway
        fields = ("title", "logo", "configuration", "is_sandbox")
