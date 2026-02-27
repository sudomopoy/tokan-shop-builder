"""
سرویس بررسی و ثبت استفاده روزانه سوالات هوش مصنوعی هر فروشگاه.
"""
from django.utils import timezone
from django.db import transaction

from ..models import GuideQuestionUsage


def get_today_usage_count(store) -> int:
    """تعداد سوالات امروز این فروشگاه را برمی‌گرداند."""
    today = timezone.localdate()
    try:
        usage = GuideQuestionUsage.objects.get(store=store, date=today)
        return usage.count
    except GuideQuestionUsage.DoesNotExist:
        return 0


def increment_usage(store) -> None:
    """یک سوال به شمارنده امروز اضافه می‌کند."""
    today = timezone.localdate()
    with transaction.atomic():
        usage, _ = GuideQuestionUsage.objects.select_for_update().get_or_create(
            store=store,
            date=today,
            defaults={"count": 0},
        )
        usage.count += 1
        usage.save(update_fields=["count"])


def get_limit_reset_time():
    """
    زمان ریست شدن سقف (شروع فردا به وقت تهران) را برمی‌گرداند.
    برای نمایش به کاربر: «تا فردا ساعت ۰۰:۰۰»
    """
    from datetime import timedelta
    today = timezone.localdate()
    tomorrow = today + timedelta(days=1)
    # زمان نیمه‌شب فردا به وقت تهران
    reset_dt = timezone.make_aware(
        timezone.datetime.combine(tomorrow, timezone.datetime.min.time()),
        timezone.get_current_timezone(),
    )
    return reset_dt


def check_can_ask(store) -> tuple[bool, str | None]:
    """
    آیا فروشگاه می‌تواند سوال بپرسد؟
    Returns (can_ask, error_message).
    - can_ask=True -> می‌تواند
    - can_ask=False -> نمی‌تواند، error_message متن خطا (شامل زمان ریست)
    """
    plan = getattr(store, "subscription_plan", None)
    if not plan:
        # بدون پلن = محدودیت نداریم (fallback امن)
        return True, None

    max_per_day = getattr(plan, "max_ai_questions_per_day", 0)
    if max_per_day == 0:
        return True, None  # نامحدود

    today_count = get_today_usage_count(store)
    if today_count >= max_per_day:
        reset_dt = get_limit_reset_time()
        # فرمت: "تا فردا ساعت ۰۰:۰۰" یا "تا ۱۴۰۴/۱۲/۰۸ ساعت ۰۰:۰۰"
        reset_str = reset_dt.strftime("%H:%M")
        date_str = reset_dt.strftime("%Y/%m/%d")
        return False, (
            f"سقف سوالات روزانه شما ({max_per_day} سوال) به پایان رسیده است. "
            f"لطفاً تا فردا ساعت {reset_str} ({date_str}) صبر کنید."
        )
    return True, None
