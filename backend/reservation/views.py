from __future__ import annotations

from datetime import date

from django.db import transaction
from django.db.models import Count, Q
from django.utils.dateparse import parse_date
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import HasReservationPermission, IsStoreCustomer, is_store_owner
from core.viewset import BaseStoreViewSet

from .models import (
    Appointment,
    ProviderTimeOff,
    ProviderWorkingHour,
    PublicHoliday,
    ReservationSetting,
    Service,
    ServiceCategory,
    ServiceProvider,
    TimeSlot,
)
from .serializers import (
    AppointmentCreateSerializer,
    AppointmentSerializer,
    AvailabilitySlotSerializer,
    ProviderTimeOffSerializer,
    ProviderWorkingHourSerializer,
    PublicHolidaySerializer,
    ReservationSettingSerializer,
    ServiceCategorySerializer,
    ServiceCreateUpdateSerializer,
    ServiceProviderCreateUpdateSerializer,
    ServiceProviderSerializer,
    ServiceSerializer,
    TimeSlotCreateUpdateSerializer,
    TimeSlotSerializer,
)
from .slot_engine import active_bookings_count, generate_service_availability, get_or_create_store_settings


class ServiceCategoryViewSet(BaseStoreViewSet):
    pagination_class = None
    serializer_class = ServiceCategorySerializer

    def get_queryset(self):
        queryset = ServiceCategory.objects.filter(store=self.request.store)

        provider_id = self.request.query_params.get("provider")
        if provider_id:
            queryset = queryset.filter(services__provider_id=provider_id)

        only_active = self.request.query_params.get("active")
        if only_active == "true":
            queryset = queryset.filter(is_active=True)
        elif only_active == "false":
            queryset = queryset.filter(is_active=False)

        return queryset.distinct().order_by("sort_order", "title")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [HasReservationPermission()]


class ServiceProviderViewSet(BaseStoreViewSet):
    pagination_class = None

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ServiceProviderCreateUpdateSerializer
        return ServiceProviderSerializer

    def get_queryset(self):
        queryset = ServiceProvider.objects.filter(store=self.request.store).prefetch_related("services")

        only_active = self.request.query_params.get("active")
        if only_active == "true":
            queryset = queryset.filter(is_active=True)
        elif only_active == "false":
            queryset = queryset.filter(is_active=False)

        return queryset.order_by("sort_order", "title")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [HasReservationPermission()]


class ServiceViewSet(BaseStoreViewSet):
    pagination_class = None

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ServiceCreateUpdateSerializer
        return ServiceSerializer

    def get_queryset(self):
        queryset = Service.objects.filter(store=self.request.store).select_related("provider", "category")

        provider_id = self.request.query_params.get("provider")
        if provider_id:
            queryset = queryset.filter(provider_id=provider_id)

        category_id = self.request.query_params.get("category")
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        only_active = self.request.query_params.get("active")
        if only_active == "true":
            queryset = queryset.filter(is_active=True, provider__is_active=True)
        elif only_active == "false":
            queryset = queryset.filter(is_active=False)

        return queryset.order_by("provider", "sort_order", "title")

    def get_permissions(self):
        if self.action in ("list", "retrieve", "availability"):
            return [AllowAny()]
        return [HasReservationPermission()]

    @action(detail=True, methods=["get"], url_path="availability", permission_classes=[AllowAny])
    def availability(self, request, pk=None):
        service = self.get_object()
        start_date_raw = request.query_params.get("start_date")
        end_date_raw = request.query_params.get("end_date")
        days_raw = request.query_params.get("days")

        start_date = parse_date(start_date_raw) if start_date_raw else date.today()
        end_date = parse_date(end_date_raw) if end_date_raw else None
        try:
            days = int(days_raw) if days_raw else None
        except Exception:
            days = None

        if not start_date:
            return Response({"detail": "start_date نامعتبر است."}, status=status.HTTP_400_BAD_REQUEST)

        slots = generate_service_availability(
            service,
            start_date=start_date,
            end_date=end_date,
            days=days,
        )
        setting = get_or_create_store_settings(service.store)

        return Response(
            {
                "service": ServiceSerializer(service, context={"request": request}).data,
                "settings": ReservationSettingSerializer(setting, context={"request": request}).data,
                "slots": AvailabilitySlotSerializer(slots, many=True).data,
            }
        )


class ReservationSettingAPIView(APIView):
    permission_classes = [HasReservationPermission]

    def get(self, request):
        setting = get_or_create_store_settings(request.store)
        return Response(ReservationSettingSerializer(setting, context={"request": request}).data)

    def patch(self, request):
        setting = get_or_create_store_settings(request.store)
        serializer = ReservationSettingSerializer(setting, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def put(self, request):
        setting = get_or_create_store_settings(request.store)
        serializer = ReservationSettingSerializer(setting, data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ProviderWorkingHourViewSet(BaseStoreViewSet):
    serializer_class = ProviderWorkingHourSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = ProviderWorkingHour.objects.filter(store=self.request.store).select_related("provider")
        provider_id = self.request.query_params.get("provider")
        if provider_id:
            queryset = queryset.filter(provider_id=provider_id)
        return queryset.order_by("provider", "weekday", "start_time")

    def get_permissions(self):
        return [HasReservationPermission()]


class ProviderTimeOffViewSet(BaseStoreViewSet):
    serializer_class = ProviderTimeOffSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = ProviderTimeOff.objects.filter(store=self.request.store).select_related("provider")
        provider_id = self.request.query_params.get("provider")
        if provider_id:
            queryset = queryset.filter(provider_id=provider_id)
        date_from = self.request.query_params.get("date_from")
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        date_to = self.request.query_params.get("date_to")
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        return queryset.order_by("date", "start_time")

    def get_permissions(self):
        return [HasReservationPermission()]


class PublicHolidayViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicHolidaySerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        queryset = PublicHoliday.objects.filter(is_active=True)
        date_from = self.request.query_params.get("date_from")
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        date_to = self.request.query_params.get("date_to")
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        return queryset.order_by("date")


class TimeSlotViewSet(BaseStoreViewSet):
    pagination_class = None

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return TimeSlotCreateUpdateSerializer
        return TimeSlotSerializer

    def get_queryset(self):
        queryset = (
            TimeSlot.objects.filter(store=self.request.store)
            .select_related("service", "service__provider", "service__category")
            .annotate(
                bookings_count=Count(
                    "appointments",
                    filter=Q(appointments__status__in=[Appointment.STATUS_PENDING, Appointment.STATUS_CONFIRMED]),
                )
            )
        )

        service_id = self.request.query_params.get("service")
        if service_id:
            queryset = queryset.filter(service_id=service_id)

        date_value = self.request.query_params.get("date")
        if date_value:
            queryset = queryset.filter(date=date_value)

        date_from = self.request.query_params.get("date_from")
        if date_from:
            queryset = queryset.filter(date__gte=date_from)

        date_to = self.request.query_params.get("date_to")
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        only_active = self.request.query_params.get("active")
        if only_active == "true":
            queryset = queryset.filter(is_active=True)
        elif only_active == "false":
            queryset = queryset.filter(is_active=False)

        return queryset.order_by("date", "start_time")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [HasReservationPermission()]


class AppointmentViewSet(BaseStoreViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        queryset = (
            Appointment.objects.filter(store=self.request.store)
            .select_related(
                "time_slot",
                "time_slot__service",
                "time_slot__service__provider",
                "time_slot__service__category",
                "store_user",
                "store_user__user",
            )
            .order_by("-created_at")
        )

        store_user = getattr(self.request, "store_user", None)
        if store_user and not is_store_owner(self.request):
            queryset = queryset.filter(store_user=store_user)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "create"):
            return [IsStoreCustomer()]
        return [HasReservationPermission()]

    @transaction.atomic
    def perform_create(self, serializer):
        slot = TimeSlot.objects.select_for_update().get(pk=serializer.validated_data["time_slot"].pk)
        if not slot.is_active:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"time_slot": "این بازه غیرفعال است."})

        if active_bookings_count(slot) >= slot.capacity:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"time_slot": "ظرفیت این بازه تکمیل شده است."})

        serializer.save(store=self.request.store, store_user=self.request.store_user, time_slot=slot)
