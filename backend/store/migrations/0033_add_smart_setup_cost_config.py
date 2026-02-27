# Data migration: add default smart_setup_cost to SystemConfig

from django.db import migrations


def add_smart_setup_cost(apps, schema_editor):
    SystemConfig = apps.get_model("store", "SystemConfig")
    if not SystemConfig.objects.filter(key="smart_setup_cost").exists():
        SystemConfig.objects.create(
            key="smart_setup_cost",
            value="0",
            description="هزینه راه‌اندازی هوشمند (ریال) - از پنل ادمین تنظیم شود",
        )


def remove_smart_setup_cost(apps, schema_editor):
    SystemConfig = apps.get_model("store", "SystemConfig")
    SystemConfig.objects.filter(key="smart_setup_cost").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0032_add_seo_analytics_torob_settings"),
    ]

    operations = [
        migrations.RunPython(add_smart_setup_cost, remove_smart_setup_cost),
    ]
