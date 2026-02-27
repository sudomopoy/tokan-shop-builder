from rest_framework import serializers
from .models import *


class WithdrawRequestSerializer(serializers.ModelSerializer):
    user_mobile = serializers.CharField(source="wallet.user.mobile", read_only=True)
    user_username = serializers.CharField(source="wallet.user.username", read_only=True)

    class Meta:
        model = WithdrawRequest
        fields = (
            "id",
            "amount",
            "status",
            "bank_sheba_or_card",
            "bank_name",
            "account_holder",
            "description",
            "rejection_reason",
            "deposit_reference_id",
            "created_at",
            "updated_at",
            "user_mobile",
            "user_username",
        )
        read_only_fields = (
            "status",
            "rejection_reason",
            "deposit_reference_id",
            "created_at",
            "updated_at",
            "user_mobile",
            "user_username",
        )


class WithdrawRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WithdrawRequest
        fields = ("amount", "bank_sheba_or_card", "bank_name", "account_holder", "description")


class WalletSerializer(serializers.ModelSerializer):
    total_balance = serializers.SerializerMethodField()
    available_balance = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = ('total_balance', 'gift_balance', 'blocked_balance', 'available_balance', 'withdrawable_balance')

    def get_available_balance(self, obj):
        return obj.available_balance

    def get_total_balance(self, obj):
        return obj.total_balance



class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ('id', 'withdrawable_amount', 'payment_method', 'timestamp', 'status', 'is_payed')

