from rest_framework import serializers
from .models import *
from wallet.models import Wallet
from wallet.serializers import WalletSerializer


class StoreAdminPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreAdminPermission
        fields = (
            "products_read", "products_write", "products_delete",
            "users_read", "users_write", "users_delete",
            "orders_read", "orders_write", "orders_delete",
            "blog_read", "blog_write", "blog_delete",
            "reservation_read", "reservation_write", "reservation_delete",
            "reviews_read", "reviews_write", "reviews_delete",
            "media_delete",
        )


class CustomerGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerGroup
        fields = ("id", "name", "slug", "description", "is_default", "is_active")


class StoreUserSerializer(serializers.ModelSerializer):
    user_mobile = serializers.CharField(source="user.mobile", read_only=True)
    user_username = serializers.CharField(source="user.username", read_only=True)
    user_is_banned = serializers.BooleanField(source="user.is_banned", read_only=True)
    admin_permissions = serializers.SerializerMethodField()
    customer_groups = CustomerGroupSerializer(many=True, read_only=True)

    class Meta:
        model = StoreUser
        fields = (
            "id",
            "user",
            "user_mobile",
            "user_username",
            "user_is_banned",
            "entry_source",
            "email",
            "level",
            "display_name",
            "register_at",
            "last_login",
            "is_admin",
            "is_admin_active",
            "is_blocked",
            "is_vendor",
            "email_is_verified",
            "customer_groups",
            "admin_permissions",
        )

    def get_admin_permissions(self, obj):
        try:
            return StoreAdminPermissionSerializer(obj.admin_permissions).data
        except StoreAdminPermission.DoesNotExist:
            return None


class StoreUserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for store owner's user list."""
    user_mobile = serializers.CharField(source="user.mobile", read_only=True)
    user_username = serializers.CharField(source="user.username", read_only=True)
    user_is_banned = serializers.BooleanField(source="user.is_banned", read_only=True)
    admin_permissions = serializers.SerializerMethodField()
    customer_groups = CustomerGroupSerializer(many=True, read_only=True)

    class Meta:
        model = StoreUser
        fields = (
            "id",
            "user",
            "user_mobile",
            "user_username",
            "user_is_banned",
            "display_name",
            "level",
            "is_admin",
            "is_admin_active",
            "is_blocked",
            "register_at",
            "last_login",
            "customer_groups",
            "admin_permissions",
        )

    def get_admin_permissions(self, obj):
        try:
            return StoreAdminPermissionSerializer(obj.admin_permissions).data
        except StoreAdminPermission.DoesNotExist:
            return None


class MakeAdminSerializer(serializers.Serializer):
    """سریالایزر برای تعیین ادمین با دسترسی‌ها."""
    permissions = StoreAdminPermissionSerializer(required=True)


class SetStoreUserGroupsSerializer(serializers.Serializer):
    group_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
        default=list,
    )


class AccountInfoSerializer(serializers.ModelSerializer):
    wallet = serializers.SerializerMethodField()
    store_user = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "username",
            "mobile",
            "national_id",
            "is_verified",
            "mobile_verified",
            "is_superuser",
            "last_login",
            "wallet",
            "store_user",
        )

    def get_store_user(self, obj):
        store_user = getattr(self.context.get('request'), 'store_user', None)
        if store_user:
            return StoreUserSerializer(store_user, read_only=True).data
        else:
            return None

    def get_wallet(self, obj):
        """کیف پول سراسری - یک کیف پول به ازای هر کاربر در کل سیستم"""
        user = self.context['request'].user
        if user:
            wallet, _ = Wallet.objects.get_or_create(user=user)
            return WalletSerializer(wallet, read_only=True).data
        return None



class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "store",
            "frequently_used",
        )


# account/serializers.py
from rest_framework import serializers
from .models import BankAccount


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = ["id", "iban", "card_number", "status", "created_at"]
        read_only_fields = ["status", "created_at"]

    def validate(self, attrs):
        if not attrs.get("iban") and not attrs.get("card_number"):
            raise serializers.ValidationError("حداقل یکی از شماره شبا یا شماره کارت باید وارد شود.")
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
