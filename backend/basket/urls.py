from rest_framework.routers import DefaultRouter
from .views import BasketViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r"baskets", BasketViewSet, basename="basket")

urlpatterns = [
    path("", include(router.urls)),
]
