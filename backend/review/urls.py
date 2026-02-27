from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductReviewViewSet

router = DefaultRouter()
router.register(r"", ProductReviewViewSet, basename="review")

urlpatterns = [
    path("", include(router.urls)),
]
