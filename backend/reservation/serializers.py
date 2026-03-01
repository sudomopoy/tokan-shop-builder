from __future__ import annotations

from datetime import date, time

from rest_framework import serializers

from media.models import Media
from media.serializers import MediaSerializer

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
from .slot_engine import SlotValidationError, active_bookings_count, resolve_or_create_dynamic_slot


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ["id", "title", "description", "sort_order", "is_active"]


class ServiceProviderSerializer(serializers.ModelSerializer):
    avatar = MediaSerializer(read_only=True)

    class Meta:
        model = ServiceProvider
        fields = ["id", "title", "description", "avatar", "sort_order", "is_active"]


class ServiceProviderCreateUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ServiceProvider
        fields = ["id", "title", "description", "avatar", "sort_order", "is_active"]


class ServiceSerializer(serializers.ModelSerializer):
    provider = ServiceProviderSerializer(read_only=True)
    category = ServiceCategorySerializer(read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "provider",
            "category",
            "title",
            "description",
            "duration_minutes",
            "price",
            "sort_order",
            "is_active",
        ]


class ServiceCreateUpdateSerializer(serializers.ModelSerializer):
    provider = serializers.PrimaryKeyRelatedField(queryset=ServiceProvider.objects.none())
    category = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.none(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Service
        fields = [
            "id",
            "provider",
            "category",
            "title",
            "description",
            "duration_minutes",
            "price",
            "sort_order",
            "is_active",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        store = request and getattr(request, "store", None)
        if store:
            self.fields["provider"].queryset = ServiceProvider.objects.filter(store=store)
            self.fields["category"].queryset = ServiceCategory.objects.filter(store=store)


class ReservationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservationSetting
        fields = [
            "id",
            "timezone",
            "slot_interval_minutes",
            "booking_window_days",
            "min_advance_minutes",
            "use_public_holidays",
        ]


class ProviderWorkingHourSerializer(serializers.ModelSerializer):
    provider_title = serializers.CharField(source="provider.title", read_only=True)

    class Meta:
        model = ProviderWorkingHour
        fields = [
            "id",
            "provider",
            "provider_title",
            "weekday",
            "start_time",
            "end_time",
            "slot_capacity",
            "is_active",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        store = request and getattr(request, "store", None)
        if store:
            self.fields["provider"].queryset = ServiceProvider.objects.filter(store=store)


class ProviderTimeOffSerializer(serializers.ModelSerializer):
    provider_title = serializers.CharField(source="provider.title", read_only=True)

    class Meta:
        model = ProviderTimeOff
        fields = [
            "id",
            "provider",
            "provider_title",
            "date",
            "title",
            "is_full_day",
            "start_time",
            "end_time",
            "is_active",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        store = request and getattr(request, "store", None)
        if store:
            self.fields["provider"].queryset = ServiceProvider.objects.filter(store=store)


class PublicHolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicHoliday
        fields = ["id", "date", "title", "description", "is_active"]


class TimeSlotSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    bookings_count = serializers.SerializerMethodField()
    remaining_capacity = serializers.SerializerMethodField()

    class Meta:
        model = TimeSlot
        fields = [
            "id",
            "service",
            "date",
            "start_time",
            "end_time",
            "capacity",
            "is_active",
            "bookings_count",
            "remaining_capacity",
        ]

    def get_bookings_count(self, obj):
        count = getattr(obj, "bookings_count", None)
        if count is not None:
            return int(count)
        return active_bookings_count(obj)

    def get_remaining_capacity(self, obj):
        return max(obj.capacity - self.get_bookings_count(obj), 0)


class TimeSlotCreateUpdateSerializer(serializers.ModelSerializer):
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.none())

    class Meta:
        model = TimeSlot
        fields = ["id", "service", "date", "start_time", "end_time", "capacity", "is_active"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        store = request and getattr(request, "store", None)
        if store:
            self.fields["service"].queryset = Service.objects.filter(store=store)


class AvailabilitySlotSerializer(serializers.Serializer):
    time_slot_id = serializers.CharField(allow_null=True)
    service_id = serializers.CharField()
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    capacity = serializers.IntegerField()
    bookings_count = serializers.IntegerField()
    remaining_capacity = serializers.IntegerField()
    is_full = serializers.BooleanField()


class AppointmentSerializer(serializers.ModelSerializer):
    time_slot = TimeSlotSerializer(read_only=True)
    store_user = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = ["id", "store_user", "time_slot", "status", "notes", "payment", "created_at", "updated_at"]

    def get_store_user(self, obj):
        user = getattr(obj.store_user, "user", None)
        return {
            "id": str(obj.store_user_id),
            "display_name": obj.store_user.display_name,
            "mobile": getattr(user, "mobile", None),
        }


class AppointmentCreateSerializer(serializers.ModelSerializer):
    time_slot = serializers.PrimaryKeyRelatedField(
        queryset=TimeSlot.objects.none(),
        required=False,
        allow_null=True,
    )
    service = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.none(),
        required=False,
        allow_null=True,
    )
    date = serializers.DateField(required=False)
    start_time = serializers.TimeField(required=False)

    class Meta:
        model = Appointment
        fields = ["time_slot", "service", "date", "start_time", "notes"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        store = request and getattr(request, "store", None)
        if store:
            self.fields["time_slot"].queryset = TimeSlot.objects.filter(store=store)
            self.fields["service"].queryset = Service.objects.filter(store=store)

    def validate(self, attrs):
        request = self.context.get("request")
        store = getattr(request, "store", None)
        if not store:
            raise serializers.ValidationError("فروشگاه نامعتبر است.")

        incoming_slot = attrs.get("time_slot")
        incoming_service = attrs.get("service")
        incoming_date: date | None = attrs.get("date")
        incoming_start_time: time | None = attrs.get("start_time")

        if incoming_slot:
            if incoming_slot.store_id != store.id:
                raise serializers.ValidationError({"time_slot": "بازه زمانی نامعتبر است."})
            attrs["time_slot"] = incoming_slot
            attrs.pop("service", None)
            attrs.pop("date", None)
            attrs.pop("start_time", None)
            return attrs

        if not incoming_service or incoming_date is None or incoming_start_time is None:
            raise serializers.ValidationError(
                "برای رزرو، یا time_slot را ارسال کنید یا service + date + start_time را کامل بدهید."
            )

        if not incoming_service.is_active or not incoming_service.provider.is_active:
            raise serializers.ValidationError("این سرویس در حال حاضر فعال نیست.")

        try:
            slot = resolve_or_create_dynamic_slot(
                service=incoming_service,
                booking_date=incoming_date,
                booking_start_time=incoming_start_time,
            )
        except SlotValidationError as exc:
            raise serializers.ValidationError({"time_slot": str(exc)})

        attrs["time_slot"] = slot
        attrs.pop("service", None)
        attrs.pop("date", None)
        attrs.pop("start_time", None)
        return attrs
