# Ensure Theme with slug "serva" exists (matches frontend theme registry)

from django.db import migrations


def ensure_serva_theme(apps, schema_editor):
    """Create serva theme if it doesn't exist."""
    Theme = apps.get_model("page", "Theme")
    if not Theme.objects.filter(slug="serva").exists():
        Theme.objects.create(
            name="سروا",
            slug="serva",
            description="تم مدرن و مینیمال با طراحی تمیز",
            is_paid=False,
            is_active=True,
            is_public=True,
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("page", "0011_theme_models_refactor"),
    ]

    operations = [
        migrations.RunPython(ensure_serva_theme, noop),
    ]
