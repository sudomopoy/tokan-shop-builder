# UserAffiliateSettings - تنظیمات به ازای هر کاربر

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("affiliate", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="affiliateearning",
            name="description",
            field=models.CharField(blank=True, help_text="توضیح (برای کمیسیون دستی)", max_length=500),
        ),
        migrations.AlterField(
            model_name="affiliateearning",
            name="order",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="affiliate_earnings", to="order.order"),
        ),
        migrations.CreateModel(
            name="UserAffiliateSettings",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("commission_percent", models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, verbose_name="درصد کمیسیون (خالی = پیش‌فرض)")),
                ("duration_months", models.PositiveIntegerField(blank=True, null=True, verbose_name="مدت اعتبار (ماه، خالی = پیش‌فرض)")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="affiliate_settings", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "تنظیمات افیلیت کاربر",
                "verbose_name_plural": "تنظیمات افیلیت کاربران",
            },
        ),
    ]
