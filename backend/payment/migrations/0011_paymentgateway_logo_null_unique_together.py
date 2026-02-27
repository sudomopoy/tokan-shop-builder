# Payment: definition + store settings — logo nullable, one gateway per type per store

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("payment", "0010_alter_paymentgatewaytype_has_sandbox"),
    ]

    operations = [
        migrations.AlterField(
            model_name="paymentgateway",
            name="logo",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.CASCADE,
                to="media.media",
            ),
        ),
        migrations.AlterUniqueTogether(
            name="paymentgateway",
            unique_together={("store", "gateway_type")},
        ),
    ]
