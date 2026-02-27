# Add current_stage to SmartSetupRequest for admin to show progress

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0036_storecategory_slug_non_unique"),
    ]

    operations = [
        migrations.AddField(
            model_name="smartsetuprequest",
            name="current_stage",
            field=models.CharField(
                blank=True,
                help_text="مرحله فعلی (ادمین در پنل ادمین مشخص می‌کند)",
                max_length=200,
            ),
        ),
    ]
