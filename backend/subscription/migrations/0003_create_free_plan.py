# ایجاد پلن رایگان یک ماهه برای فروشگاه‌های جدید

from datetime import timedelta
from django.db import migrations
from django.utils import timezone


def create_free_plan(apps, schema_editor):
    SubscriptionPlan = apps.get_model("subscription", "SubscriptionPlan")
    Plan = apps.get_model("store", "Plan")

    if SubscriptionPlan.objects.filter(title__icontains="رایگان").exists():
        return

    default_store_plan = Plan.objects.filter(is_default=True).first()

    SubscriptionPlan.objects.create(
        title="پلن رایگان",
        description="یک ماه رایگان برای شروع",
        level=0,
        is_active=True,
        is_default=False,
        store_plan=default_store_plan,
    )


def remove_free_plan(apps, schema_editor):
    SubscriptionPlan = apps.get_model("subscription", "SubscriptionPlan")
    SubscriptionPlan.objects.filter(title__icontains="رایگان").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("subscription", "0002_create_default_plan"),
    ]

    operations = [
        migrations.RunPython(create_free_plan, remove_free_plan),
    ]
