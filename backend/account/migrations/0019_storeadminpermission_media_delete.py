# Add media_delete to StoreAdminPermission

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0018_storeadminpermission_storeuser_is_blocked_storeuser_is_admin_active"),
    ]

    operations = [
        migrations.AddField(
            model_name="storeadminpermission",
            name="media_delete",
            field=models.BooleanField(default=False),
        ),
    ]
