# Migration: Replace PaymentGateway.name with PaymentGatewayType FK

import uuid
from django.db import migrations, models
import django.db.models.deletion


# Display titles for known gateway types
GATEWAY_TYPE_TITLES = {
    "zarinpal": "زرین پال",
    "aghayepardakht": "آقای پرداخت",
}


def create_gateway_types_and_assign(apps, schema_editor):
    PaymentGatewayType = apps.get_model("payment", "PaymentGatewayType")
    PaymentGateway = apps.get_model("payment", "PaymentGateway")

    # Create types for each unique name in existing gateways
    type_by_name = {}
    for gw in PaymentGateway.objects.all():
        name = gw.name or "zarinpal"
        if name not in type_by_name:
            type_by_name[name] = PaymentGatewayType.objects.create(
                name=name,
                title=GATEWAY_TYPE_TITLES.get(name, name),
            )

    # Assign gateway_type to each PaymentGateway
    for gw in PaymentGateway.objects.all():
        name = gw.name or "zarinpal"
        gw.gateway_type = type_by_name[name]
        gw.save()


def reverse_migration(apps, schema_editor):
    PaymentGateway = apps.get_model("payment", "PaymentGateway")
    for gw in PaymentGateway.objects.select_related("gateway_type").all():
        gw.name = gw.gateway_type.name
        gw.save()


class Migration(migrations.Migration):

    dependencies = [
        ("payment", "0007_paymentgateway_is_sandbox"),
    ]

    operations = [
        migrations.CreateModel(
            name="PaymentGatewayType",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now_add=True)),
                ("name", models.CharField(max_length=100, unique=True)),
                ("title", models.CharField(max_length=100)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.AddField(
            model_name="paymentgateway",
            name="gateway_type",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="gateways",
                to="payment.paymentgatewaytype",
            ),
        ),
        migrations.RunPython(create_gateway_types_and_assign, reverse_migration),
        migrations.RemoveField(
            model_name="paymentgateway",
            name="name",
        ),
        migrations.AlterField(
            model_name="paymentgateway",
            name="gateway_type",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="gateways",
                to="payment.paymentgatewaytype",
            ),
        ),
    ]
