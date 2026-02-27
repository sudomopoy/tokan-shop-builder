# Generated migration for Product digital fields

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("media", "0001_initial"),
        ("product", "0015_product_categories"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="product_type",
            field=models.CharField(
                choices=[("physical", "فیزیکی"), ("digital", "دیجیتال")],
                default="physical",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="digital_subtype",
            field=models.CharField(
                blank=True,
                choices=[
                    ("downloadable", "دانلودی"),
                    ("streaming", "استریمینگ"),
                    ("request_only", "ثبت درخواست"),
                    ("account_credentials", "اکانت/اعتبارات"),
                ],
                help_text="فقط برای محصولات دیجیتال",
                max_length=30,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="downloadable_file",
            field=models.ForeignKey(
                blank=True,
                help_text="فایل دانلودی - فقط برای digital_subtype=downloadable",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="downloadable_products",
                to="media.media",
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="streaming_url",
            field=models.URLField(
                blank=True,
                help_text="لینک استریم - فقط برای digital_subtype=streaming",
                max_length=500,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="custom_input_definitions",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='آرایه تعریف ورودی‌ها، مثلاً: [{"key":"email","label":"ایمیل","type":"email","required":true}]',
            ),
        ),
    ]
