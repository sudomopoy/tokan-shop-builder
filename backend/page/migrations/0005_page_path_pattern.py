# Generated manually for dynamic path pattern support

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("page", "0004_widget_widget_config"),
    ]

    operations = [
        migrations.AddField(
            model_name="page",
            name="path_pattern",
            field=models.CharField(
                blank=True,
                help_text="الگوی مسیر داینامیک. مثال: /product/:id:number/:slug?:string",
                max_length=500,
                null=True,
            ),
        ),
    ]
