# Generated migration for StoreAdminPermission, is_blocked, is_admin_active

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0017_remove_pageguide"),
    ]

    operations = [
        migrations.CreateModel(
            name="StoreAdminPermission",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("products_read", models.BooleanField(default=False)),
                ("products_write", models.BooleanField(default=False)),
                ("products_delete", models.BooleanField(default=False)),
                ("users_read", models.BooleanField(default=False)),
                ("users_write", models.BooleanField(default=False)),
                ("users_delete", models.BooleanField(default=False)),
                ("orders_read", models.BooleanField(default=False)),
                ("orders_write", models.BooleanField(default=False)),
                ("orders_delete", models.BooleanField(default=False)),
                ("blog_read", models.BooleanField(default=False)),
                ("blog_write", models.BooleanField(default=False)),
                ("blog_delete", models.BooleanField(default=False)),
                (
                    "store_user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="admin_permissions",
                        to="account.storeuser",
                    ),
                ),
            ],
            options={
                "db_table": "account_storeadminpermission",
                "verbose_name": "دسترسی ادمین فروشگاه",
                "verbose_name_plural": "دسترسی‌های ادمین فروشگاه",
            },
        ),
        migrations.AddField(
            model_name="storeuser",
            name="is_admin_active",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="storeuser",
            name="is_blocked",
            field=models.BooleanField(default=False),
        ),
    ]
