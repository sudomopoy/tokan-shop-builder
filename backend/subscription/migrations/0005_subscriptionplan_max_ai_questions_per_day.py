# اضافه کردن max_ai_questions_per_day به SubscriptionPlan

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("subscription", "0004_subscriptionplan_max_admins"),
    ]

    operations = [
        migrations.AddField(
            model_name="subscriptionplan",
            name="max_ai_questions_per_day",
            field=models.PositiveIntegerField(
                default=10,
                help_text="حداکثر تعداد سوال از دستیار هوش مصنوعی در هر روز. 0 یعنی نامحدود.",
                verbose_name="حداکثر سوال روزانه هوش مصنوعی",
            ),
        ),
    ]
