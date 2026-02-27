# Generated migration for OrderItem custom_input_values

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("order", "0026_shippingmethod_is_active_tracking_optional"),
    ]

    operations = [
        migrations.AddField(
            model_name="orderitem",
            name="custom_input_values",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="مقادیر ورودی سفارشی برای محصولات دیجیتال (key->value)",
            ),
        ),
    ]
