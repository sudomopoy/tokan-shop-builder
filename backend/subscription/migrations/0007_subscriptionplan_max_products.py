# اضافه کردن max_products به SubscriptionPlan (null = نامحدود)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("subscription", "0006_subscriptionplan_store_categories"),
    ]

    operations = [
        migrations.AddField(
            model_name="subscriptionplan",
            name="max_products",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="حداکثر تعداد محصولات قابل تعریف برای فروشگاه. خالی = نامحدود.",
                null=True,
                verbose_name="حداکثر محصولات",
            ),
        ),
    ]
