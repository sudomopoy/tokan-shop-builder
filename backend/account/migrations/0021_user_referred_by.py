# referred_by for affiliate tracking

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0020_user_referral_code"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="referred_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="referred_users",
                to=settings.AUTH_USER_MODEL,
                verbose_name="دعوت شده توسط",
            ),
        ),
    ]
