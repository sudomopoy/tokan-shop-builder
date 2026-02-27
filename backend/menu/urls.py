from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MenuViewSet, MenuItemViewSet

router = DefaultRouter()
router.register(r"menus", MenuViewSet, basename="menu")
router.register(r"menu-items", MenuItemViewSet, basename="menu-item")

urlpatterns = router.urls
