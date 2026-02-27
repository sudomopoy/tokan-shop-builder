from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceProviderViewSet, ServiceViewSet, TimeSlotViewSet, AppointmentViewSet

router = DefaultRouter()
router.register(r"providers", ServiceProviderViewSet, basename="reservation-provider")
router.register(r"services", ServiceViewSet, basename="reservation-service")
router.register(r"slots", TimeSlotViewSet, basename="reservation-slot")
router.register(r"appointments", AppointmentViewSet, basename="reservation-appointment")

urlpatterns = [
    path("", include(router.urls)),
]
