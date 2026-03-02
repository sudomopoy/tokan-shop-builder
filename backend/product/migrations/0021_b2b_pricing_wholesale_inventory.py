import uuid

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0025_customergroup_storeusergroupmembership_and_more"),
        ("order", "0027_orderitem_custom_input_values"),
        ("product", "0020_product_average_rating_reviews_count"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="allowed_customer_groups",
            field=models.ManyToManyField(
                blank=True,
                related_name="allowed_products",
                to="account.customergroup",
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="is_wholesale_mode",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="product",
            name="min_order_quantity",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="product",
            name="max_order_quantity",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="product",
            name="pack_size",
            field=models.PositiveIntegerField(
                default=1,
                validators=[django.core.validators.MinValueValidator(1)],
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="min_pack_count",
            field=models.PositiveIntegerField(
                default=1,
                validators=[django.core.validators.MinValueValidator(1)],
            ),
        ),
        migrations.CreateModel(
            name="ProductGroupPrice",
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
                ("price", models.DecimalField(blank=True, decimal_places=2, max_digits=20, null=True)),
                ("sell_price", models.DecimalField(decimal_places=2, max_digits=20)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "customer_group",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="product_group_prices",
                        to="account.customergroup",
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="group_prices",
                        to="product.product",
                    ),
                ),
                (
                    "store",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="store.store",
                    ),
                ),
                (
                    "variant",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="group_prices",
                        to="product.variant",
                    ),
                ),
            ],
            options={
                "ordering": ("product_id", "variant_id", "customer_group_id"),
                "unique_together": {("product", "variant", "customer_group")},
            },
        ),
        migrations.CreateModel(
            name="ProductTierDiscount",
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
                ("min_quantity", models.PositiveIntegerField(default=1)),
                ("max_quantity", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "discount_percent",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=5,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(100),
                        ],
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                (
                    "customer_group",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="product_tier_discounts",
                        to="account.customergroup",
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="quantity_discounts",
                        to="product.product",
                    ),
                ),
                (
                    "store",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="store.store",
                    ),
                ),
            ],
            options={
                "ordering": ("-min_quantity", "-discount_percent"),
            },
        ),
        migrations.CreateModel(
            name="StoreCartTierDiscount",
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
                    "criterion",
                    models.CharField(
                        choices=[("amount", "Amount"), ("items_count", "Items count")],
                        max_length=20,
                    ),
                ),
                ("min_value", models.DecimalField(decimal_places=2, default=0, max_digits=20)),
                ("max_value", models.DecimalField(blank=True, decimal_places=2, max_digits=20, null=True)),
                (
                    "discount_percent",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=5,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(100),
                        ],
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                (
                    "customer_group",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="cart_tier_discounts",
                        to="account.customergroup",
                    ),
                ),
                (
                    "store",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="store.store",
                    ),
                ),
            ],
            options={
                "ordering": ("criterion", "-min_value", "-discount_percent"),
            },
        ),
        migrations.CreateModel(
            name="InventoryAdjustmentLog",
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
                    "reason",
                    models.CharField(
                        choices=[
                            ("manual_set", "Manual set"),
                            ("manual_increase", "Manual increase"),
                            ("manual_decrease", "Manual decrease"),
                            ("order_deduct", "Order deduct"),
                            ("order_restore", "Order restore"),
                        ],
                        max_length=40,
                    ),
                ),
                ("quantity_before", models.IntegerField()),
                ("quantity_after", models.IntegerField()),
                ("quantity_change", models.IntegerField()),
                ("note", models.TextField(blank=True, default="")),
                (
                    "actor_store_user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="inventory_logs",
                        to="account.storeuser",
                    ),
                ),
                (
                    "actor_user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_inventory_logs",
                        to="account.user",
                    ),
                ),
                (
                    "order",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="inventory_logs",
                        to="order.order",
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="inventory_logs",
                        to="product.product",
                    ),
                ),
                (
                    "store",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="store.store",
                    ),
                ),
                (
                    "variant",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="inventory_logs",
                        to="product.variant",
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at",),
            },
        ),
    ]
