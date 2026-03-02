from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, TorobProductViewSet, StoreCartTierDiscountViewSet
from .views import VariantAttributeViewSet, VariantAttributeValueViewSet
from review.views import ProductReviewViewSet

router = DefaultRouter()
# IMPORTANT: Register specific prefixes BEFORE the catch-all product routes to avoid conflicts
router.register(r"variant-attributes", VariantAttributeViewSet, basename="variant-attributes")
router.register(r"variant-attribute-values", VariantAttributeValueViewSet, basename="variant-attribute-values")
router.register(r"cart-tier-discounts", StoreCartTierDiscountViewSet, basename="cart-tier-discounts")
router.register(r"torob", TorobProductViewSet, basename="torob_products")
router.register(r"", ProductViewSet)

urlpatterns = [
    path("<uuid:product_pk>/reviews/", ProductReviewViewSet.as_view({
        "get": "list",
        "post": "create",
    }), name="product-reviews"),
    path("", include(router.urls)),
]
