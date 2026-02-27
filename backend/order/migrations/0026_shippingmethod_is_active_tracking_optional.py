# is_active for disable without delete; tracking_code_base_url optional

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("order", "0025_alter_shippingmethod_definition_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="shippingmethod",
            name="is_active",
            field=models.BooleanField(
                default=True,
                help_text="غیرفعال کردن روش ارسال بدون حذف آن.",
            ),
        ),
        migrations.AlterField(
            model_name="shippingmethod",
            name="tracking_code_base_url",
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
    ]
