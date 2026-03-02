from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("order", "0027_orderitem_custom_input_values"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="cart_discount_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=20),
        ),
        migrations.AddField(
            model_name="order",
            name="cart_discount_percent",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
    ]
