# Generated manually for SupportRequest model

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="SupportRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200, verbose_name="نام و نام خانوادگی")),
                ("phone", models.CharField(max_length=20, verbose_name="شماره تماس")),
                (
                    "business_type",
                    models.CharField(blank=True, max_length=100, verbose_name="نوع کسب\u200cوکار"),
                ),
                ("message", models.TextField(blank=True, verbose_name="توضیحات")),
                (
                    "source",
                    models.CharField(
                        default="landing",
                        help_text="مثلاً landing, pricing, showcase",
                        max_length=50,
                        verbose_name="منبع",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")),
            ],
            options={
                "verbose_name": "درخواست پشتیبانی/مشاوره",
                "verbose_name_plural": "درخواست‌های پشتیبانی و مشاوره",
                "ordering": ["-created_at"],
            },
        ),
    ]
