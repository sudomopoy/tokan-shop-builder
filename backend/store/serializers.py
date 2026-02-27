from rest_framework import serializers
from rest_framework.serializers import ModelSerializer, SerializerMethodField
from store.models import Store, SettingDefinition, StoreSetting, StoreCategory
from media.serializers import MediaSerializer
from rest_framework.exceptions import ValidationError


class StoreCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreCategory
        fields = ["id", "title", "slug", "description", "index", "capabilities"]


class SettingDefinitionSerializer(ModelSerializer):
    class Meta:
        model = SettingDefinition
        fields = "__all__"
class StoreSettingSerializer(ModelSerializer):
    definition = SettingDefinitionSerializer(read_only=True)

    class Meta:
        model = StoreSetting
        fields = [
            "definition", 
            "value", 
            "key",
        ]


class StorePublicSerializer(ModelSerializer):
    favicon = MediaSerializer(read_only=True)
    minimal_logo = MediaSerializer(read_only=True)
    full_logo = MediaSerializer(read_only=True)
    theme_slug = SerializerMethodField()
    store_category = StoreCategorySerializer(read_only=True)

    class Meta:
        model = Store
        fields = [
            "id",
            "title",
            "en_title",
            "name",
            "favicon",
            "minimal_logo",
            "full_logo",
            "external_domain",
            "internal_domain",
            "description",
            "slogan",
            "theme_slug",
            "store_category",
            "is_new",
        ]

    def get_theme_slug(self, obj):
        return (obj.theme.slug if obj.theme else "default") or "default"


class StoreSerializer(ModelSerializer):
    favicon = MediaSerializer(read_only=True)
    minimal_logo = MediaSerializer(read_only=True)
    full_logo = MediaSerializer(read_only=True)
    settings = StoreSettingSerializer(many=True)

    class Meta:
        model = Store
        fields = [
            "id",
            "title",
            "en_title",
            "name",
            "favicon",
            "minimal_logo",
            "full_logo",
            "external_domain",
            "internal_domain",
            "description",
            "slogan",
            "settings",
            "is_new",
        ]

    def get_settings(self, obj):
        settings = StoreSetting.objects.filter(store=obj.id)
        return StoreSettingSerializer(settings, many=True, context=self.context).data


from media.models import Media
from account.models import User
from store.models import Plan
from account.models import StoreUser
from page.models import Theme

class StoreSerializer(serializers.ModelSerializer):
    favicon = MediaSerializer(read_only=True)
    minimal_logo = MediaSerializer(read_only=True)
    full_logo = MediaSerializer(read_only=True)
    plan = serializers.PrimaryKeyRelatedField(
        queryset=Plan.objects.all(), required=False, allow_null=True
    )
    owner = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )
    super_store = serializers.PrimaryKeyRelatedField(
        queryset=Store.objects.all(), required=False, allow_null=True
    )
    settings = StoreSettingSerializer(many=True)
    theme = serializers.PrimaryKeyRelatedField(
        queryset=Theme.objects.all(), required=False, allow_null=True
    )
    theme_slug = serializers.SerializerMethodField()
    subscription_expires_at = serializers.DateTimeField(read_only=True)
    subscription_days_remaining = serializers.SerializerMethodField()
    subscription_plan = serializers.SerializerMethodField()
    store_category = StoreCategorySerializer(read_only=True)

    class Meta:
        model = Store
        fields = [
            "id",
            "title",
            "en_title",
            "name",
            "store_category",
            "favicon",
            "minimal_logo",
            "full_logo",
            "external_domain",
            "internal_domain",
            "is_new",
            "is_banned",
            "is_active",
            "is_shared_store",
            "gift_percentage",
            "has_gift",
            "plan",
            "description",
            "slogan",
            "theme",
            "theme_slug",
            "owner",
            "super_store",
            "settings",
            "subscription_expires_at",
            "subscription_days_remaining",
            "subscription_plan",
        ]

    def get_subscription_days_remaining(self, obj):
        return getattr(obj, "subscription_days_remaining", None)

    def get_subscription_plan(self, obj):
        plan = getattr(obj, "subscription_plan", None)
        if not plan:
            return None
        return {"id": str(plan.id), "title": plan.title, "level": plan.level}

    def get_theme_slug(self, obj):
        return (obj.theme.slug if obj.theme else "default") or "default"

    def validate(self, data):
        # Prevent non-superusers from creating super stores
        request = self.context.get("request")
        if (
            request
            and data.get("_is_super_store", False)
            and not request.user.is_superuser
        ):
            raise serializers.ValidationError(
                "Only superusers can create super stores."
            )

        return data

    def get_settings(self, obj):
        settings = StoreSetting.objects.filter(store=obj.id)
        return StoreSettingSerializer(settings, many=True, context=self.context).data

    def create(self, validated_data):
        # Set default values
        if "owner" not in validated_data:
            validated_data["owner"] = self.context["request"].user

        if "super_store" not in validated_data:
            validated_data["super_store"] = Store.get_super_store()

        if not validated_data.get("name"):
            raise ValidationError(
                {
                    "error":"آیدی فروشگاه معتبر نیست."
                }
            )

        # Ensure non-superusers can't create super stores
        if (
            "_is_super_store" in validated_data
            and not validated_data["owner"].is_superuser
        ):
            validated_data["_is_super_store"] = False
        
        return super().create(validated_data)


class StoreUpdateSerializer(StoreSerializer):
    """Serializer for PATCH - allows updating logo fields by ID. Blocks external_domain when store has custom domain.
    store_category is read-only after creation; only superuser can change it via Django admin."""

    def validate(self, data):
        data = super().validate(data)
        if "external_domain" in data and self.instance:
            if self.instance.has_custom_domain:
                raise serializers.ValidationError({
                    "external_domain": "پس از ثبت دامنه اختصاصی، امکان ویرایش آن وجود ندارد."
                })
        if "store_category" in self.initial_data:
            raise serializers.ValidationError({
                "store_category": "دسته‌بندی فروشگاه فقط هنگام ایجاد قابل تعیین است و پس از آن قابل تغییر نیست. در صورت نیاز، تنها ادمین سیستم می‌تواند آن را تغییر دهد."
            })
        return data
    favicon = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(),
        required=False,
        allow_null=True
    )
    minimal_logo = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(),
        required=False,
        allow_null=True
    )
    full_logo = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta(StoreSerializer.Meta):
        pass


class StoreCreateSerializer(StoreSerializer):
    minimal_logo = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(),
        required=False,
        allow_null=True
    )
    store_category = serializers.PrimaryKeyRelatedField(
        queryset=StoreCategory.objects.all(),
        required=False,
        allow_null=True
    )
    theme_slug = serializers.CharField(required=False, allow_blank=True, default="default")

    class Meta(StoreSerializer.Meta):
        fields = [
            "title",
            "en_title",
            "name",
            "external_domain",
            "description",
            "slogan",
            "minimal_logo",
            "store_category",
            "theme_slug",
        ]

    def validate(self, attrs):
        user = self.context["request"].user

        # بررسی مالکیت فایل‌ها
        for field in ["favicon", "minimal_logo", "full_logo"]:
            media = attrs.get(field)
            if media and media.owner != user:
                raise serializers.ValidationError(
                    {field: "این فایل متعلق به شما نیست."}
                )
        return attrs

    def create(self, validated_data):
        from django.utils import timezone
        from datetime import timedelta
        from subscription.models import SubscriptionPlan
        from page.models import Theme

        validated_data["owner"] = self.context["request"].user
        validated_data["super_store"] = Store.get_super_store()
        validated_data["plan"], _ = Plan.objects.get_or_create(is_default=True)

        # پلن رایگان یک ماهه
        free_plan = SubscriptionPlan.objects.filter(
            title__icontains="رایگان", is_active=True
        ).first()
        if free_plan:
            validated_data["subscription_plan"] = free_plan
            validated_data["subscription_expires_at"] = timezone.now() + timedelta(days=30)

        theme_slug = validated_data.pop("theme_slug", None) or "default"
        theme = Theme.objects.filter(slug=theme_slug).first()
        if theme:
            validated_data["theme"] = theme

        if not validated_data.get("en_title") and validated_data.get("name"):
            validated_data["en_title"] = validated_data["name"]

        return super().create(validated_data)
