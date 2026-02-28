from django.db import migrations


def seed_widget_types(apps, schema_editor):
    WidgetType = apps.get_model("page", "WidgetType")
    defaults = [
        ("menu", False),
        ("content.text", False),
        ("content.image", False),
        ("form.builder", False),
    ]
    for name, is_layout in defaults:
        WidgetType.objects.get_or_create(
            name=name,
            defaults={"is_layout": is_layout, "is_active": True},
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("page", "0013_widget_builder_visual_schema"),
    ]

    operations = [
        migrations.RunPython(seed_widget_types, noop),
    ]
