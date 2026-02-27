# Generated migration for WithdrawRequest

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0019_storeadminpermission_media_delete"),
        ("wallet", "0015_wallet_user_global"),
    ]

    operations = [
        migrations.CreateModel(
            name="WithdrawRequest",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now_add=True)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=20, verbose_name="مبلغ")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "در انتظار بررسی"),
                            ("approved", "تایید شده"),
                            ("rejected", "رد شده"),
                            ("deposited", "واریز شده"),
                        ],
                        default="pending",
                        max_length=20,
                        verbose_name="وضعیت",
                    ),
                ),
                ("bank_sheba_or_card", models.CharField(max_length=50, verbose_name="شماره شبا یا کارت")),
                ("bank_name", models.CharField(max_length=100, verbose_name="نام بانک")),
                ("account_holder", models.CharField(max_length=150, verbose_name="صاحب حساب")),
                ("description", models.TextField(blank=True, verbose_name="توضیحات درخواست")),
                ("rejection_reason", models.TextField(blank=True, verbose_name="دلیل رد (نمایش به کاربر)")),
                ("rejected_at", models.DateTimeField(blank=True, null=True)),
                ("deposit_reference_id", models.CharField(blank=True, max_length=100, verbose_name="شناسه واریز")),
                ("deposited_at", models.DateTimeField(blank=True, null=True)),
                (
                    "deposited_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="deposited_withdraw_requests",
                        to="account.user",
                    ),
                ),
                (
                    "rejected_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="rejected_withdraw_requests",
                        to="account.user",
                    ),
                ),
                (
                    "transaction",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="withdraw_request",
                        to="wallet.transaction",
                    ),
                ),
                (
                    "wallet",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="withdraw_requests",
                        to="wallet.wallet",
                        verbose_name="کیف پول",
                    ),
                ),
            ],
            options={
                "verbose_name": "درخواست برداشت",
                "verbose_name_plural": "درخواست‌های برداشت",
                "ordering": ["-created_at"],
            },
        ),
    ]
