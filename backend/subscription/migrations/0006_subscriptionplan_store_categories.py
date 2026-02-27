# Generated migration for SubscriptionPlan store_categories M2M

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0035_storecategory_slug_capabilities"),
        ("subscription", "0005_subscriptionplan_max_ai_questions_per_day"),
    ]

    operations = [
        migrations.AddField(
            model_name="subscriptionplan",
            name="store_categories",
            field=models.ManyToManyField(
                blank=True,
                help_text="خالی = پلن برای همه دسته‌ها معتبر است",
                related_name="subscription_plans",
                to="store.storecategory",
                verbose_name="دسته‌های فروشگاه",
            ),
        ),
    ]
