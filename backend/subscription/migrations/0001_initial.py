# Generated manually for subscription app

import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("store", "0026_add_contact_social_trust_settings"),
        ("payment", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SubscriptionPlan",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=200, verbose_name="عنوان")),
                ("description", models.TextField(blank=True, verbose_name="توضیحات")),
                ("level", models.PositiveIntegerField(default=0, verbose_name="سطح")),
                ("is_active", models.BooleanField(default=True, verbose_name="فعال")),
                ("is_default", models.BooleanField(default=False, verbose_name="پلن پیش‌فرض")),
                (
                    "store_plan",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="subscription_plans",
                        to="store.plan",
                        verbose_name="پلن فروشگاه",
                    ),
                ),
            ],
            options={
                "verbose_name": "پلن اشتراک",
                "verbose_name_plural": "پلن‌های اشتراک",
                "db_table": "subscription_plan",
                "ordering": ["level", "title"],
            },
        ),
        migrations.CreateModel(
            name="SubscriptionDiscountCode",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("code", models.CharField(max_length=50, unique=True, verbose_name="کد")),
                (
                    "discount_type",
                    models.CharField(
                        choices=[("percent", "درصدی"), ("fixed", "مبلغ ثابت")],
                        default="percent",
                        max_length=10,
                        verbose_name="نوع تخفیف",
                    ),
                ),
                (
                    "discount_value",
                    models.DecimalField(
                        decimal_places=0,
                        max_digits=12,
                        validators=[django.core.validators.MinValueValidator(0)],
                        verbose_name="مقدار تخفیف",
                    ),
                ),
                (
                    "max_uses",
                    models.PositiveIntegerField(
                        blank=True,
                        help_text="خالی = نامحدود",
                        null=True,
                        verbose_name="حداکثر استفاده",
                    ),
                ),
                ("used_count", models.PositiveIntegerField(default=0, verbose_name="تعداد استفاده")),
                ("valid_from", models.DateTimeField(blank=True, null=True, verbose_name="اعتبار از")),
                ("valid_until", models.DateTimeField(blank=True, null=True, verbose_name="اعتبار تا")),
                ("is_active", models.BooleanField(default=True, verbose_name="فعال")),
                (
                    "min_duration_months",
                    models.PositiveIntegerField(
                        blank=True,
                        null=True,
                        verbose_name="حداقل مدت (ماه)",
                    ),
                ),
                (
                    "plan",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="discount_codes",
                        to="subscription.subscriptionplan",
                        verbose_name="پلن (اختیاری)",
                    ),
                ),
            ],
            options={
                "verbose_name": "کد تخفیف اشتراک",
                "verbose_name_plural": "کدهای تخفیف اشتراک",
                "db_table": "subscription_discount_code",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="SubscriptionPlanDuration",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "duration_months",
                    models.PositiveIntegerField(
                        validators=[django.core.validators.MinValueValidator(1)],
                        verbose_name="مدت (ماه)",
                    ),
                ),
                (
                    "base_price",
                    models.DecimalField(
                        decimal_places=0,
                        max_digits=12,
                        validators=[django.core.validators.MinValueValidator(0)],
                        verbose_name="قیمت پایه (تومان)",
                    ),
                ),
                (
                    "discount_percent",
                    models.DecimalField(
                        decimal_places=2,
                        default=0,
                        max_digits=5,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(100),
                        ],
                        verbose_name="تخفیف درصدی",
                    ),
                ),
                ("is_active", models.BooleanField(default=True, verbose_name="فعال")),
                (
                    "plan",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="durations",
                        to="subscription.subscriptionplan",
                        verbose_name="پلن",
                    ),
                ),
            ],
            options={
                "verbose_name": "مدت پلن اشتراک",
                "verbose_name_plural": "مدت‌های پلن اشتراک",
                "db_table": "subscription_plan_duration",
                "ordering": ["plan", "duration_months"],
                "unique_together": {("plan", "duration_months")},
            },
        ),
        migrations.CreateModel(
            name="SubscriptionPayment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("duration_months", models.PositiveIntegerField(verbose_name="مدت (ماه)")),
                (
                    "amount",
                    models.DecimalField(
                        decimal_places=0,
                        max_digits=12,
                        verbose_name="مبلغ پرداختی",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "در انتظار"),
                            ("completed", "تکمیل شده"),
                            ("failed", "ناموفق"),
                            ("cancelled", "لغو شده"),
                        ],
                        default="pending",
                        max_length=20,
                        verbose_name="وضعیت",
                    ),
                ),
                (
                    "discount_code",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="subscription_payments",
                        to="subscription.subscriptiondiscountcode",
                        verbose_name="کد تخفیف",
                    ),
                ),
                (
                    "plan",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="payments",
                        to="subscription.subscriptionplan",
                        verbose_name="پلن",
                    ),
                ),
                (
                    "payment",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="subscription_payment",
                        to="payment.payment",
                        verbose_name="پرداخت",
                    ),
                ),
                (
                    "store",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="subscription_payments",
                        to="store.store",
                        verbose_name="فروشگاه",
                    ),
                ),
            ],
            options={
                "verbose_name": "پرداخت اشتراک",
                "verbose_name_plural": "پرداخت‌های اشتراک",
                "db_table": "subscription_payment",
                "ordering": ["-created_at"],
            },
        ),
    ]
