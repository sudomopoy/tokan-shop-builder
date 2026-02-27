# Add has_sandbox to PaymentGatewayType

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payment", "0008_paymentgatewaytype_replace_name_with_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="paymentgatewaytype",
            name="has_sandbox",
            field=models.BooleanField(default=True),
        ),
    ]
