# Extend Theme model: slug, gallery, tags, category, is_paid, price, demo_url

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("page", "0008_widgettype_theme"),
    ]

    operations = [
        migrations.AddField(
            model_name="theme",
            name="slug",
            field=models.SlugField(blank=True, max_length=100, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="theme",
            name="gallery",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="theme",
            name="tags",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="theme",
            name="category",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="theme",
            name="is_paid",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="theme",
            name="price",
            field=models.DecimalField(blank=True, decimal_places=0, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name="theme",
            name="demo_url",
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
