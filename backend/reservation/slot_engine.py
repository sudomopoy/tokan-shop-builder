from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from django.db.models import Count, Q
from django.utils import timezone

from .models import (
    Appointment,
    ProviderTimeOff,
    ProviderWorkingHour,
    PublicHoliday,
    ReservationSetting,
    Service,
    TimeSlot,
)

ACTIVE_BOOKING_STATUSES = [
    Appointment.STATUS_PENDING,
    Appointment.STATUS_CONFIRMED,
]

DEFAULT_AVAILABILITY_DAYS = 14
MAX_AVAILABILITY_DAYS = 90


class SlotValidationError(Exception):
    pass


def get_or_create_store_settings(store) -> ReservationSetting:
    settings_obj = ReservationSetting.objects.filter(store=store).first()
    if settings_obj:
        return settings_obj
    return ReservationSetting.objects.create(store=store)


def _tzinfo(tz_name: str) -> ZoneInfo:
    try:
        return ZoneInfo(tz_name)
    except Exception:
        return ZoneInfo("Asia/Tehran")


def _aware_local(dt: datetime, tz_name: str) -> datetime:
    tz = _tzinfo(tz_name)
    if timezone.is_naive(dt):
        return timezone.make_aware(dt, timezone=tz)
    return dt.astimezone(tz)


def _date_sequence(start_date: date, end_date: date):
    cursor = start_date
    while cursor <= end_date:
        yield cursor
        cursor += timedelta(days=1)


def _is_blocked_by_time_off(day_offs: list[ProviderTimeOff], slot_start: time, slot_end: time) -> bool:
    for item in day_offs:
        if item.is_full_day or (item.start_time is None and item.end_time is None):
            return True
        if item.start_time and item.end_time:
            overlaps = slot_start < item.end_time and slot_end > item.start_time
            if overlaps:
                return True
    return False


def _parse_days(days: int | None) -> int:
    if days is None:
        return DEFAULT_AVAILABILITY_DAYS
    try:
        value = int(days)
    except Exception:
        value = DEFAULT_AVAILABILITY_DAYS
    return max(1, min(value, MAX_AVAILABILITY_DAYS))


def generate_service_availability(
    service: Service,
    start_date: date,
    *,
    days: int | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    settings_obj = get_or_create_store_settings(service.store)
    now_local = timezone.now().astimezone(_tzinfo(settings_obj.timezone))
    min_allowed_start = now_local + timedelta(minutes=settings_obj.min_advance_minutes)

    today_local = now_local.date()
    window_end = today_local + timedelta(days=settings_obj.booking_window_days - 1)

    safe_start = max(start_date, today_local)
    if end_date is None:
        end_date = safe_start + timedelta(days=_parse_days(days) - 1)
    safe_end = min(end_date, window_end)
    if safe_start > safe_end:
        return []

    schedule_rows = list(
        ProviderWorkingHour.objects.filter(
            store=service.store,
            provider=service.provider,
            is_active=True,
        ).order_by("weekday", "start_time")
    )
    if not schedule_rows:
        return []

    schedules_by_weekday: dict[int, list[ProviderWorkingHour]] = {}
    for row in schedule_rows:
        schedules_by_weekday.setdefault(row.weekday, []).append(row)

    day_off_rows = list(
        ProviderTimeOff.objects.filter(
            store=service.store,
            provider=service.provider,
            is_active=True,
            date__range=(safe_start, safe_end),
        )
    )
    day_off_by_date: dict[date, list[ProviderTimeOff]] = {}
    for row in day_off_rows:
        day_off_by_date.setdefault(row.date, []).append(row)

    holiday_dates: set[date] = set()
    if settings_obj.use_public_holidays:
        holiday_dates = set(
            PublicHoliday.objects.filter(is_active=True, date__range=(safe_start, safe_end)).values_list("date", flat=True)
        )

    slots_qs = (
        TimeSlot.objects.filter(
            store=service.store,
            service=service,
            date__range=(safe_start, safe_end),
        )
        .annotate(
            bookings_count=Count(
                "appointments",
                filter=Q(appointments__status__in=ACTIVE_BOOKING_STATUSES),
            )
        )
        .order_by("date", "start_time")
    )
    manual_slots: dict[tuple[date, time], TimeSlot] = {
        (slot.date, slot.start_time): slot for slot in slots_qs
    }

    duration = timedelta(minutes=service.duration_minutes)
    interval = timedelta(minutes=settings_obj.slot_interval_minutes)

    combined: dict[tuple[date, time], dict[str, Any]] = {}

    for cursor_date in _date_sequence(safe_start, safe_end):
        if cursor_date in holiday_dates:
            continue

        day_offs = day_off_by_date.get(cursor_date, [])
        if any(item.is_full_day or (item.start_time is None and item.end_time is None) for item in day_offs):
            continue

        weekday_schedules = schedules_by_weekday.get(cursor_date.weekday(), [])
        for schedule in weekday_schedules:
            current_start = datetime.combine(cursor_date, schedule.start_time)
            schedule_end = datetime.combine(cursor_date, schedule.end_time)

            while current_start + duration <= schedule_end:
                slot_start = current_start.time()
                slot_end = (current_start + duration).time()

                if _is_blocked_by_time_off(day_offs, slot_start, slot_end):
                    current_start += interval
                    continue

                slot_start_aware = _aware_local(current_start, settings_obj.timezone)
                if slot_start_aware < min_allowed_start:
                    current_start += interval
                    continue

                key = (cursor_date, slot_start)
                existing = manual_slots.get(key)
                if existing and not existing.is_active:
                    current_start += interval
                    continue

                capacity = int(existing.capacity if existing else schedule.slot_capacity)
                bookings_count = int(getattr(existing, "bookings_count", 0) if existing else 0)
                remaining = max(capacity - bookings_count, 0)

                record = {
                    "time_slot_id": str(existing.id) if existing else None,
                    "service_id": str(service.id),
                    "date": cursor_date,
                    "start_time": slot_start,
                    "end_time": slot_end,
                    "capacity": capacity,
                    "bookings_count": bookings_count,
                    "remaining_capacity": remaining,
                    "is_full": remaining <= 0,
                }

                previous = combined.get(key)
                if not previous or (existing and not previous.get("time_slot_id")):
                    combined[key] = record

                current_start += interval

    return [combined[key] for key in sorted(combined.keys())]


def resolve_or_create_dynamic_slot(
    *,
    service: Service,
    booking_date: date,
    booking_start_time: time,
) -> TimeSlot:
    availability = generate_service_availability(
        service,
        start_date=booking_date,
        end_date=booking_date,
        days=1,
    )
    match = next(
        (
            slot
            for slot in availability
            if slot["date"] == booking_date and slot["start_time"] == booking_start_time
        ),
        None,
    )
    if not match:
        raise SlotValidationError("بازه زمانی انتخاب‌شده قابل رزرو نیست.")

    if match["is_full"]:
        raise SlotValidationError("ظرفیت این بازه تکمیل شده است.")

    if match["time_slot_id"]:
        return TimeSlot.objects.get(pk=match["time_slot_id"])

    slot, _ = TimeSlot.objects.get_or_create(
        service=service,
        date=booking_date,
        start_time=booking_start_time,
        defaults={
            "store": service.store,
            "end_time": match["end_time"],
            "capacity": match["capacity"],
            "is_active": True,
        },
    )
    return slot


def active_bookings_count(slot: TimeSlot) -> int:
    return slot.appointments.filter(status__in=ACTIVE_BOOKING_STATUSES).count()
