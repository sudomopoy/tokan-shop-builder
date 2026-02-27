from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SystemAnnouncementViewSet

router = DefaultRouter()
router.register(r"", SystemAnnouncementViewSet, basename="system-announcement")

urlpatterns = [
    path("", include(router.urls)),
]
