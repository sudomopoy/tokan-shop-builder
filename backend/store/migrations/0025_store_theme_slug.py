# Migration: add theme FK to Store (relation to page.Theme)

from django.db import migrations, models
import django.db.models.deletion


def migrate_theme_from_settings(apps, schema_editor):
    """Set store.theme from StoreSetting theme_slug by resolving Theme by slug."""
    Store = apps.get_model("store", "Store")
    StoreSetting = apps.get_model("store", "StoreSetting")
    SettingDefinition = apps.get_model("store", "SettingDefinition")
    Theme = apps.get_model("page", "Theme")

    try:
        definition = SettingDefinition.objects.get(key="theme_slug")
    except SettingDefinition.DoesNotExist:
        definition = None

    default_theme = Theme.objects.filter(slug="default").first()
    if not default_theme:
        default_theme = Theme.objects.first()

    for store in Store.objects.all():
        slug = "default"
        if definition:
            try:
                setting = StoreSetting.objects.get(store=store, definition=definition)
                slug = (setting.value or definition.default_value or "default").strip() or "default"
            except StoreSetting.DoesNotExist:
                pass
        theme = Theme.objects.filter(slug=slug).first() or default_theme
        if theme:
            store.theme_id = theme.id
            store.save(update_fields=["theme_id"])


def reverse_migrate(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0024_add_theme_slug_setting"),
        ("page", "0011_theme_models_refactor"),  # ensure Theme exists
    ]

    operations = [
        migrations.AddField(
            model_name="store",
            name="theme",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="stores",
                to="page.theme",
            ),
        ),
        migrations.RunPython(migrate_theme_from_settings, reverse_migrate),
    ]
