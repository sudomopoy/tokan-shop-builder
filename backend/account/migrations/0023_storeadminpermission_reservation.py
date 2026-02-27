# Add reservation permissions to StoreAdminPermission

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0022_referral_code_5_chars_uppercase"),
    ]

    operations = [
        migrations.AddField(
            model_name="storeadminpermission",
            name="reservation_read",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="storeadminpermission",
            name="reservation_write",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="storeadminpermission",
            name="reservation_delete",
            field=models.BooleanField(default=False),
        ),
    ]
