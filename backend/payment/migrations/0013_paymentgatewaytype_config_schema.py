# Add config_schema to PaymentGatewayType for dynamic gateway config fields in store settings

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("payment", "0012_alter_paymentgateway_configuration"),
    ]

    operations = [
        migrations.AddField(
            model_name="paymentgatewaytype",
            name="config_schema",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="List of {key, label, type: text|password|number, required} for gateway configuration.",
            ),
        ),
    ]
