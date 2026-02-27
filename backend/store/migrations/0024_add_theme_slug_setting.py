# Data migration: add theme_slug SettingDefinition for store theme selection

from django.db import migrations


def add_theme_slug_definition(apps, schema_editor):
    SettingDefinition = apps.get_model("store", "SettingDefinition")
    if not SettingDefinition.objects.filter(key="theme_slug").exists():
        SettingDefinition.objects.create(
            key="theme_slug",
            type="text",
            default_value="default",
            description="شناسه تم فروشگاه (مثلاً default)",
            can_edit_by_store=True,
        )


def remove_theme_slug_definition(apps, schema_editor):
    SettingDefinition = apps.get_model("store", "SettingDefinition")
    SettingDefinition.objects.filter(key="theme_slug").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0023_alter_storesize_unique_together_and_more"),
    ]

    operations = [
        migrations.RunPython(add_theme_slug_definition, remove_theme_slug_definition),
    ]
