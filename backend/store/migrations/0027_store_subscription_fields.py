# Add subscription_plan and subscription_expires_at to Store

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0026_add_contact_social_trust_settings"),
        ("subscription", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="store",
            name="subscription_expires_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="تاریخ انقضای اشتراک"),
        ),
        migrations.AddField(
            model_name="store",
            name="subscription_plan",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="stores",
                to="subscription.subscriptionplan",
                verbose_name="پلن اشتراک",
            ),
        ),
    ]
