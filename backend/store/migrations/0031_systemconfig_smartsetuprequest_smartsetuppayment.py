# Generated manually - setup models for smart setup flow

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("payment", "0001_initial"),
        ("store", "0030_remove_store_unique_super_store"),
    ]

    operations = [
        migrations.CreateModel(
            name="SystemConfig",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(db_index=True, max_length=100, unique=True)),
                ("value", models.TextField(blank=True)),
                ("description", models.TextField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name="SmartSetupRequest",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("status", models.CharField(choices=[("pending", "در انتظار"), ("done", "انجام شد")], default="pending", max_length=20)),
                ("cost_amount", models.DecimalField(decimal_places=0, default=0, help_text="مبلغ پرداختی (ریال)", max_digits=15)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("store", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="smart_setup_requests", to="store.store")),
            ],
        ),
        migrations.CreateModel(
            name="SmartSetupPayment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("payment", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="smart_setup_payment", to="payment.payment")),
                ("smart_setup_request", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="payment_record", to="store.smartsetuprequest")),
            ],
        ),
    ]
