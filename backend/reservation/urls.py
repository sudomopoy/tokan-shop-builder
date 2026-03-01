from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AppointmentViewSet,
    ProviderTimeOffViewSet,
    ProviderWorkingHourViewSet,
    PublicHolidayViewSet,
    ReservationSettingAPIView,
    ServiceCategoryViewSet,
    ServiceProviderViewSet,
    ServiceViewSet,
    TimeSlotViewSet,
)

router = DefaultRouter()
router.register(r"categories", ServiceCategoryViewSet, basename="reservation-category")
router.register(r"providers", ServiceProviderViewSet, basename="reservation-provider")
router.register(r"services", ServiceViewSet, basename="reservation-service")
router.register(r"working-hours", ProviderWorkingHourViewSet, basename="reservation-working-hour")
router.register(r"time-offs", ProviderTimeOffViewSet, basename="reservation-time-off")
router.register(r"public-holidays", PublicHolidayViewSet, basename="reservation-public-holiday")
router.register(r"slots", TimeSlotViewSet, basename="reservation-slot")
router.register(r"appointments", AppointmentViewSet, basename="reservation-appointment")

urlpatterns = [
    path("settings/", ReservationSettingAPIView.as_view(), name="reservation-settings"),
    path("", include(router.urls)),
]
