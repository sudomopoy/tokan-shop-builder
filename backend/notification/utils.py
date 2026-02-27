"""
توابع کمکی برای ایجاد اعلان سیستمی توسط بخش‌های مختلف سیستم.
مثال استفاده:
    from notification.utils import create_system_announcement
    create_system_announcement(store_id=None, title="سفارش جدید", message="...", source="order")
"""


def create_system_announcement(
    *,
    store_id=None,
    title: str,
    message: str = "",
    notification_type: str = "info",
    source: str = "system",
    link: str = "",
):
    """
    ایجاد اعلان سیستمی به صورت برنامه‌نویسی.
    store_id=None یعنی برای همه فروشگاه‌ها.
    """
    from .models import SystemAnnouncement

    return SystemAnnouncement.objects.create(
        store_id=store_id,
        title=title,
        message=message,
        notification_type=notification_type,
        source=source,
        link=link or "",
    )
