# Generated migration for PaymentGateway.is_sandbox

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payment', '0006_payment_order'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymentgateway',
            name='is_sandbox',
            field=models.BooleanField(default=False),
        ),
    ]
