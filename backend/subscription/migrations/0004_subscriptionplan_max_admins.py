# اضافه کردن max_admins به SubscriptionPlan

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("subscription", "0003_create_free_plan"),
    ]

    operations = [
        migrations.AddField(
            model_name="subscriptionplan",
            name="max_admins",
            field=models.PositiveIntegerField(
                default=0,
                help_text="حداکثر تعداد ادمین‌های فروشگاه. 0 یعنی امکان تعریف ادمین نیست.",
                verbose_name="حداکثر ادمین",
            ),
        ),
    ]
