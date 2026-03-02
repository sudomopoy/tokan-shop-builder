import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0024_storeadminpermission_reviews"),
    ]

    operations = [
        migrations.CreateModel(
            name="CustomerGroup",
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
                ("created_at", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now_add=True)),
                ("name", models.CharField(max_length=120)),
                ("slug", models.SlugField(blank=True, max_length=140)),
                ("description", models.TextField(blank=True, default="")),
                ("is_default", models.BooleanField(default=False)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "store",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="store.store",
                    ),
                ),
            ],
            options={
                "ordering": ("name",),
                "unique_together": {("store", "slug")},
            },
        ),
        migrations.CreateModel(
            name="StoreUserGroupMembership",
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
                ("created_at", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now_add=True)),
                (
                    "customer_group",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="memberships",
                        to="account.customergroup",
                    ),
                ),
                (
                    "store_user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="group_memberships",
                        to="account.storeuser",
                    ),
                ),
            ],
            options={
                "unique_together": {("store_user", "customer_group")},
            },
        ),
        migrations.AddField(
            model_name="storeuser",
            name="customer_groups",
            field=models.ManyToManyField(
                blank=True,
                related_name="store_users",
                through="account.StoreUserGroupMembership",
                to="account.customergroup",
            ),
        ),
    ]
