# Generated migration for reservation app

import uuid
from django.core.validators import MinValueValidator
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("store", "0035_storecategory_slug_capabilities"),
        ("media", "0001_initial"),
        ("account", "0001_initial"),
        ("payment", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ServiceProvider",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now_add=True)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("avatar", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reservation_providers", to="media.media")),
                ("store", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="store.store")),
            ],
            options={
                "verbose_name": "ارائه\u200cدهنده خدمات",
                "verbose_name_plural": "ارائه\u200cدهندگان خدمات",
                "ordering": ["sort_order", "title"],
            },
        ),
        migrations.CreateModel(
            name="Service",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now_add=True)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("duration_minutes", models.PositiveIntegerField(default=30, help_text="مدت زمان سرویس به دقیقه", validators=[MinValueValidator(5)])),
                ("price", models.DecimalField(decimal_places=2, default=0, max_digits=20, validators=[MinValueValidator(0)])),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("provider", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="services", to="reservation.serviceprovider")),
                ("store", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="store.store")),
            ],
            options={
                "verbose_name": "سرویس",
                "verbose_name_plural": "سرویس\u200cها",
                "ordering": ["provider", "sort_order", "title"],
            },
        ),
        migrations.CreateModel(
            name="TimeSlot",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now_add=True)),
                ("date", models.DateField()),
                ("start_time", models.TimeField()),
                ("end_time", models.TimeField()),
                ("capacity", models.PositiveIntegerField(default=1)),
                ("service", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="time_slots", to="reservation.service")),
                ("store", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="store.store")),
            ],
            options={
                "verbose_name": "بازه زمانی",
                "verbose_name_plural": "بازه\u200cهای زمانی",
                "ordering": ["date", "start_time"],
                "unique_together": {("service", "date", "start_time")},
            },
        ),
        migrations.CreateModel(
            name="Appointment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now_add=True)),
                ("status", models.CharField(choices=[("pending", "در انتظار تایید"), ("confirmed", "تایید شده"), ("completed", "انجام شده"), ("cancelled", "لغو شده")], default="pending", max_length=20)),
                ("notes", models.TextField(blank=True)),
                ("payment", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reservation_appointments", to="payment.payment")),
                ("store", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="store.store")),
                ("store_user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="appointments", to="account.storeuser")),
                ("time_slot", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="appointments", to="reservation.timeslot")),
            ],
            options={
                "verbose_name": "رزرو",
                "verbose_name_plural": "رزروها",
                "ordering": ["-created_at"],
            },
        ),
    ]
