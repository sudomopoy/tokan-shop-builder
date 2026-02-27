# Generated migration for Payment.order

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('order', '0023_order_is_canceled_order_is_completed_order_is_failed'),
        ('payment', '0005_remove_payment_type_payment_is_online_payment'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='order',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='order.order'),
        ),
    ]
