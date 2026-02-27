# Initial migration for ProductReview

import django.core.validators
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("product", "0020_product_average_rating_reviews_count"),
        ("store", "0001_initial"),
        ("account", "0024_storeadminpermission_reviews"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductReview",
            fields=[
                ("id", models.UUIDField(editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now_add=True)),
                (
                    "rating",
                    models.PositiveSmallIntegerField(
                        help_text="امتیاز از ۱ تا ۵ ستاره",
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(5),
                        ],
                    ),
                ),
                ("body", models.TextField(blank=True, default="", verbose_name="متن نظر")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "در انتظار تایید"),
                            ("approved", "تایید شده"),
                            ("rejected", "رد شده"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                (
                    "approved_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="approved_reviews",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reviews",
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
                    "store_user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="product_reviews",
                        to="account.storeuser",
                    ),
                ),
            ],
            options={
                "verbose_name": "نظر محصول",
                "verbose_name_plural": "نظرات محصولات",
                "ordering": ["-created_at"],
                "unique_together": {("product", "store_user")},
            },
        ),
    ]
