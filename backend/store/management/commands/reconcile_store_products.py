"""
دستور مدیریت برای هماهنگ‌سازی محصولات فروشگاه با محدودیت‌های پلن.
در فروشگاه‌هایی که اشتراک منقضی شده و به پلنی با تعداد محصولات کمتر آمده‌اند،
محصولات اضافی غیرفعال می‌شوند.

برای اجرای دوره‌ای (مثلاً روزانه) با cron:
  python manage.py reconcile_store_products
"""
from django.core.management.base import BaseCommand

from store.models import Store
from account.admin_utils import reconcile_store_products_for_plan


class Command(BaseCommand):
    help = "هماهنگ‌سازی محصولات فروشگاه با محدودیت max_products پلن اشتراک"

    def handle(self, *args, **options):
        count = 0
        for store in Store.objects.exclude(_is_super_store=True).iterator():
            before = store.product_set.filter(is_active=True).count()
            reconcile_store_products_for_plan(store)
            after = store.product_set.filter(is_active=True).count()
            if before != after:
                count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"فروشگاه {store.name}: {before} -> {after} محصول فعال"
                    )
                )
        self.stdout.write(self.style.SUCCESS(f"بررسی انجام شد. {count} فروشگاه با تغییر."))
