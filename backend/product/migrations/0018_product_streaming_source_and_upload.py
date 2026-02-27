# Generated migration for Product streaming_source, streaming_video, streaming_hls_path

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("media", "0001_initial"),
        ("product", "0017_product_downloadable_files_remove_account_credentials"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="streaming_source",
            field=models.CharField(
                blank=True,
                choices=[("external_link", "لینک استریم خارجی"), ("uploaded", "آپلود ویدیو (HLS)")],
                default="external_link",
                help_text="منبع استریم: لینک خارجی یا آپلود",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="streaming_video",
            field=models.ForeignKey(
                blank=True,
                help_text="فایل ویدیوی آپلودشده - فقط وقتی streaming_source=uploaded",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="streaming_source_products",
                to="media.media",
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="streaming_hls_path",
            field=models.CharField(
                blank=True,
                help_text="مسیر HLS پردازش‌شده - پر می‌شود پس از تبدیل ویدیو",
                max_length=500,
                null=True,
            ),
        ),
    ]
