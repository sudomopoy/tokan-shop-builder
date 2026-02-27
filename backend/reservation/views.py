from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from core.viewset import BaseStoreViewSet
from core.permissions import IsStoreCustomer, HasReservationPermission

from .models import ServiceProvider, Service, TimeSlot, Appointment
from .serializers import (
    ServiceProviderSerializer,
    ServiceProviderCreateUpdateSerializer,
    ServiceSerializer,
    ServiceCreateUpdateSerializer,
    TimeSlotSerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
)


class ServiceProviderViewSet(BaseStoreViewSet):
    pagination_class = None  # لیست ارائه‌دهندگان معمولاً کوچک است

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ServiceProviderCreateUpdateSerializer
        return ServiceProviderSerializer

    def get_queryset(self):
        return ServiceProvider.objects.filter(store=self.request.store).prefetch_related("services")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [HasReservationPermission()]


class ServiceViewSet(BaseStoreViewSet):
    pagination_class = None  # لیست سرویس‌ها معمولاً کوچک است

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ServiceCreateUpdateSerializer
        return ServiceSerializer

    def get_queryset(self):
        qs = Service.objects.filter(store=self.request.store).select_related("provider")
        provider_id = self.request.query_params.get("provider")
        if provider_id:
            qs = qs.filter(provider_id=provider_id)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [HasReservationPermission()]


class TimeSlotViewSet(BaseStoreViewSet):
    serializer_class = TimeSlotSerializer

    def get_queryset(self):
        qs = TimeSlot.objects.filter(store=self.request.store).select_related(
            "service", "service__provider"
        )
        service_id = self.request.query_params.get("service")
        if service_id:
            qs = qs.filter(service_id=service_id)
        date = self.request.query_params.get("date")
        if date:
            qs = qs.filter(date=date)
        return qs.order_by("date", "start_time")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [HasReservationPermission()]


class AppointmentViewSet(BaseStoreViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        qs = Appointment.objects.filter(store=self.request.store).select_related(
            "time_slot", "time_slot__service", "time_slot__service__provider",
            "store_user", "store_user__user"
        ).order_by("-created_at")
        store_user = getattr(self.request, "store_user", None)
        from core.permissions import is_store_owner
        if store_user and not is_store_owner(self.request):
            qs = qs.filter(store_user=store_user)
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        if self.action == "create":
            return [IsStoreCustomer()]
        return [HasReservationPermission()]

    def perform_create(self, serializer):
        serializer.save(store_user=self.request.store_user)
