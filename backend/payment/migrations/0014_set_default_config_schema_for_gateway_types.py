# Set config_schema for known gateway types (zarinpal, aghayepardakht) so store settings can show config fields

from django.db import migrations


def set_config_schema(apps, schema_editor):
    PaymentGatewayType = apps.get_model("payment", "PaymentGatewayType")
    for gt in PaymentGatewayType.objects.filter(name="zarinpal"):
        if not gt.config_schema:
            gt.config_schema = [
                {"key": "merchant_id", "label": "مرچنت آی دی (UUID)", "type": "text", "required": True},
            ]
            gt.save()
    for gt in PaymentGatewayType.objects.filter(name="aghayepardakht"):
        if not gt.config_schema:
            gt.config_schema = [
                {"key": "merchant_id", "label": "مرچنت آی دی", "type": "text", "required": True},
            ]
            gt.save()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("payment", "0013_paymentgatewaytype_config_schema"),
    ]

    operations = [
        migrations.RunPython(set_config_schema, noop),
    ]
