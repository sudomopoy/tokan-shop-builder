"""
ارسال SMS یادآور برای فروشگاه‌هایی که اشتراکشان در حال انقضا است.

استفاده:
  python manage.py send_subscription_reminders
  python manage.py send_subscription_reminders --days 7

برای تنظیم template ID در sms.ir، مقدار SUBSCRIPTION_REMINDER_SMS_TEMPLATE_ID را در settings قرار دهید.
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings

from store.models import Store
from helper.sms import send_template_sms


class Command(BaseCommand):
    help = "ارسال SMS یادآور اشتراک به مالکین فروشگاه‌هایی که اشتراکشان در حال انقضا است"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="فروشگاه‌هایی که تا N روز دیگر اشتراکشان منقضی می‌شود (پیش‌فرض: 7)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="فقط لیست بدون ارسال",
        )

    def handle(self, *args, **options):
        days = options["days"]
        dry_run = options["dry_run"]
        template_id = getattr(
            settings,
            "SUBSCRIPTION_REMINDER_SMS_TEMPLATE_ID",
            None,
        )
        if not template_id:
            self.stdout.write(
                self.style.WARNING(
                    "SUBSCRIPTION_REMINDER_SMS_TEMPLATE_ID در settings تنظیم نشده. "
                    "Template ID را بعداً اضافه کنید و این دستور را دوباره اجرا کنید."
                )
            )
            return

        now = timezone.now()
        threshold = now + timedelta(days=days)

        # فروشگاه‌هایی که اشتراک دارند و در بازه [now, threshold] منقضی می‌شود
        stores = Store.objects.filter(
            subscription_expires_at__gte=now,
            subscription_expires_at__lte=threshold,
            owner__isnull=False,
        ).select_related("owner")

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"[DRY-RUN] {stores.count()} فروشگاه برای یادآوری یافت شد."
                )
            )
            for s in stores[:10]:
                delta = (s.subscription_expires_at - now).days
                self.stdout.write(
                    f"  - {s.name} | انقضا: {s.subscription_expires_at.date()} | {delta} روز دیگر"
                )
            if stores.count() > 10:
                self.stdout.write(f"  ... و {stores.count() - 10} مورد دیگر")
            return

        sent = 0
        for store in stores:
            mobile = store.owner.mobile
            if not mobile:
                continue
            try:
                delta = (store.subscription_expires_at - now).days
                send_template_sms(
                    [
                        {"Name": "STORE_NAME", "Value": str(store.title)[:30]},
                        {"Name": "STORE", "Value": str(store.name)},
                        {"Name": "DAYS", "Value": str(delta)},
                        {"Name": "EXPIRE_DATE", "Value": store.subscription_expires_at.strftime("%Y/%m/%d")},
                    ],
                    mobile,
                    template_id,
                )
                sent += 1
                self.stdout.write(f"  ارسال شد: {store.name} -> {mobile}")
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"  خطا برای {store.name}: {e}")
                )

        self.stdout.write(
            self.style.SUCCESS(f"یادآوری به {sent} فروشگاه ارسال شد.")
        )
