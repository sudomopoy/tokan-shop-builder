# Add reviews permissions to StoreAdminPermission

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0023_storeadminpermission_reservation"),
    ]

    operations = [
        migrations.AddField(
            model_name="storeadminpermission",
            name="reviews_read",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="storeadminpermission",
            name="reviews_write",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="storeadminpermission",
            name="reviews_delete",
            field=models.BooleanField(default=False),
        ),
    ]
