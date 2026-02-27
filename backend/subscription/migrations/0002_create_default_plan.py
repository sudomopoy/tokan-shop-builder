# ایجاد پلن پیش‌فرض اشتراک با مدت‌های ۱، ۳ و ۱۲ ماهه

from decimal import Decimal
from django.db import migrations


def create_default_plan(apps, schema_editor):
    SubscriptionPlan = apps.get_model("subscription", "SubscriptionPlan")
    SubscriptionPlanDuration = apps.get_model("subscription", "SubscriptionPlanDuration")
    Plan = apps.get_model("store", "Plan")

    if SubscriptionPlan.objects.exists():
        return

    # پلن پیش‌فرض فروشگاه (برای امکانات)
    default_store_plan = Plan.objects.filter(is_default=True).first()

    sub_plan = SubscriptionPlan.objects.create(
        title="پلن پایه",
        description="فروشگاه آنلاین کامل\nدرگاه پرداخت\nمدیریت محصولات و سفارشات\nپشتیبانی فنی",
        level=1,
        is_active=True,
        is_default=True,
        store_plan=default_store_plan,
    )

    SubscriptionPlanDuration.objects.bulk_create([
        SubscriptionPlanDuration(
            plan=sub_plan,
            duration_months=1,
            base_price=Decimal("100000"),
            discount_percent=Decimal("0"),
            is_active=True,
        ),
        SubscriptionPlanDuration(
            plan=sub_plan,
            duration_months=3,
            base_price=Decimal("270000"),
            discount_percent=Decimal("10"),
            is_active=True,
        ),
        SubscriptionPlanDuration(
            plan=sub_plan,
            duration_months=12,
            base_price=Decimal("960000"),
            discount_percent=Decimal("20"),
            is_active=True,
        ),
    ])


def remove_default_plan(apps, schema_editor):
    SubscriptionPlanDuration = apps.get_model("subscription", "SubscriptionPlanDuration")
    SubscriptionPlan = apps.get_model("subscription", "SubscriptionPlan")

    SubscriptionPlanDuration.objects.filter(plan__is_default=True).delete()
    SubscriptionPlan.objects.filter(is_default=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("subscription", "0001_initial"),
        ("store", "0027_store_subscription_fields"),
    ]

    operations = [
        migrations.RunPython(create_default_plan, remove_default_plan),
    ]
