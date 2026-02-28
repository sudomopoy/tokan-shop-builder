# Generated manually for visual page-builder enhancements.
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("media", "0007_alter_media_file"),
        ("page", "0012_ensure_serva_theme"),
    ]

    operations = [
        migrations.AddField(
            model_name="widgettype",
            name="default_components_config",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="widgettype",
            name="default_extra_request_params",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="widgettype",
            name="default_widget_config",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="widgettype",
            name="icon",
            field=models.CharField(
                blank=True,
                help_text="Dashboard icon key for visual builder, e.g. text, image, layout.",
                max_length=120,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="widgettype",
            name="visual_schema",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Visual input schema for dashboard page builder.",
            ),
        ),
        migrations.CreateModel(
            name="WidgetStyle",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now_add=True)),
                ("key", models.SlugField(max_length=100)),
                ("name", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True, null=True)),
                ("order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("default_widget_config", models.JSONField(blank=True, default=dict)),
                ("default_components_config", models.JSONField(blank=True, default=dict)),
                ("default_extra_request_params", models.JSONField(blank=True, default=dict)),
                (
                    "preview_image",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="widget_styles",
                        to="media.media",
                    ),
                ),
                (
                    "widget_type",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="styles",
                        to="page.widgettype",
                    ),
                ),
            ],
            options={
                "verbose_name": "Widget Style",
                "verbose_name_plural": "Widget Styles",
                "ordering": ["widget_type", "order", "name"],
                "unique_together": {("widget_type", "key")},
            },
        ),
    ]
