# Unify path and path_pattern into single path field

from django.db import migrations, models


def migrate_path_pattern_to_path(apps, schema_editor):
    """Copy path_pattern to path for pages that have it, then path_pattern will be removed."""
    Page = apps.get_model("page", "Page")
    for page in Page.objects.exclude(path_pattern__isnull=True).exclude(path_pattern=""):
        page.path = page.path_pattern
        page.save()


def reverse_migrate(apps, schema_editor):
    """No reverse - path_pattern data would be lost. Path keeps current value."""
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("page", "0006_alter_page_path_alter_page_path_pattern"),
    ]

    operations = [
        migrations.RunPython(migrate_path_pattern_to_path, reverse_migrate),
        migrations.RemoveField(
            model_name="page",
            name="path_pattern",
        ),
        migrations.AlterField(
            model_name="page",
            name="path",
            field=models.CharField(
                help_text="مسیر ثابت (/ یا /about) یا الگوی داینامیک (/product/:id:number/:slug?:string)",
                max_length=500,
            ),
        ),
    ]
