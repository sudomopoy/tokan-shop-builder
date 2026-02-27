from rest_framework import serializers
from .models import ServiceProvider, Service, TimeSlot, Appointment
from media.serializers import MediaSerializer
from media.models import Media


class ServiceProviderSerializer(serializers.ModelSerializer):
    avatar = MediaSerializer(read_only=True)

    class Meta:
        model = ServiceProvider
        fields = ["id", "title", "description", "avatar", "sort_order"]


class ServiceProviderCreateUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ServiceProvider
        fields = ["id", "title", "description", "avatar", "sort_order"]


class ServiceSerializer(serializers.ModelSerializer):
    provider = ServiceProviderSerializer(read_only=True)

    class Meta:
        model = Service
        fields = ["id", "provider", "title", "description", "duration_minutes", "price", "sort_order"]


class ServiceCreateUpdateSerializer(serializers.ModelSerializer):
    provider = serializers.PrimaryKeyRelatedField(queryset=ServiceProvider.objects.none())

    class Meta:
        model = Service
        fields = ["id", "provider", "title", "description", "duration_minutes", "price", "sort_order"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        store = self.context.get("request") and getattr(self.context["request"], "store", None)
        if store:
            self.fields["provider"].queryset = ServiceProvider.objects.filter(store=store)


class TimeSlotSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    bookings_count = serializers.SerializerMethodField()

    class Meta:
        model = TimeSlot
        fields = ["id", "service", "date", "start_time", "end_time", "capacity", "bookings_count"]

    def get_bookings_count(self, obj):
        return obj.appointments.filter(status__in=["pending", "confirmed"]).count()


class AppointmentSerializer(serializers.ModelSerializer):
    time_slot = TimeSlotSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = ["id", "store_user", "time_slot", "status", "notes", "payment", "created_at", "updated_at"]


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ["time_slot", "notes"]

    def validate_time_slot(self, value):
        store = self.context.get("request").store
        if value.service.provider.store_id != store.id:
            raise serializers.ValidationError("بازه زمانی نامعتبر است.")
        count = value.appointments.filter(status__in=["pending", "confirmed"]).count()
        if count >= value.capacity:
            raise serializers.ValidationError("این بازه ظرفیت ندارد.")
        return value
