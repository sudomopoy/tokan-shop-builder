# Data migration: set slug for existing themes, create default if none exist

from django.db import migrations


def set_theme_slugs(apps, schema_editor):
    Theme = apps.get_model("page", "Theme")
    themes = Theme.objects.all()
    for t in themes:
        if not t.slug and t.name:
            t.slug = t.name.lower().replace(" ", "-").replace("_", "-")
            t.save()

    # If no themes exist, create default (optional - frontend has fallback)
    if not Theme.objects.exists():
        Theme.objects.create(
            name="تم پیش‌فرض",
            slug="default",
            description="تم پیش‌فرض و رایگان با طراحی ساده و حرفه‌ای",
            is_paid=False,
            is_active=True,
            is_public=True,
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("page", "0009_theme_extended"),
    ]

    operations = [
        migrations.RunPython(set_theme_slugs, noop),
    ]
