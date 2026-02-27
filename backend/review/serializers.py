from rest_framework import serializers
from .models import ProductReview


class ProductReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductReview
        fields = ["rating", "body"]
        extra_kwargs = {
            "rating": {"required": True},
            "body": {"required": False, "allow_blank": True},
        }


class ProductReviewPublicSerializer(serializers.ModelSerializer):
    """برای نمایش عمومی (نظرات تایید شده)."""
    display_name = serializers.CharField(source="store_user.display_name", read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%SZ", read_only=True)

    class Meta:
        model = ProductReview
        fields = ["id", "rating", "body", "display_name", "created_at"]
        read_only_fields = fields


class ProductReviewAdminSerializer(serializers.ModelSerializer):
    """برای داشبورد - شامل وضعیت و جزئیات بیشتر."""
    display_name = serializers.CharField(source="store_user.display_name", read_only=True)
    user_mobile = serializers.CharField(source="store_user.user.mobile", read_only=True)
    product_title = serializers.CharField(source="product.title", read_only=True)
    product_id = serializers.UUIDField(source="product.id", read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%SZ", read_only=True)
    approved_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%SZ", read_only=True, allow_null=True)

    class Meta:
        model = ProductReview
        fields = [
            "id",
            "product",
            "product_id",
            "product_title",
            "store_user",
            "display_name",
            "user_mobile",
            "rating",
            "body",
            "status",
            "approved_at",
            "approved_by",
            "created_at",
        ]
        read_only_fields = fields
