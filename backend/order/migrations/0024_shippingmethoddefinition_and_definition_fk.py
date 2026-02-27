# Shipping: definition + store settings — add ShippingMethodDefinition and FK on ShippingMethod

from django.db import migrations, models


def create_default_definition_and_assign(apps, schema_editor):
    ShippingMethodDefinition = apps.get_model("order", "ShippingMethodDefinition")
    ShippingMethod = apps.get_model("order", "ShippingMethod")
    definition = ShippingMethodDefinition.objects.create(
        slug="post-pishtaz",
        name="پست پیشتاز",
        description="پست پیشتاز",
        default_shipping_payment_on_delivery=False,
        default_product_payment_on_delivery=False,
        default_max_payment_on_delivery=0,
        default_base_shipping_price=49000,
        default_shipping_price_per_extra_kilograms=20000,
        default_tracking_code_base_url="https://tracking.post.ir/?id=%tracking_code%",
    )
    ShippingMethod.objects.filter(definition__isnull=True).update(definition=definition)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("order", "0023_order_is_canceled_order_is_completed_order_is_failed"),
    ]

    operations = [
        migrations.CreateModel(
            name="ShippingMethodDefinition",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(max_length=80, unique=True)),
                ("name", models.CharField(max_length=100)),
                ("description", models.TextField(blank=True, null=True)),
                ("default_shipping_payment_on_delivery", models.BooleanField(default=False)),
                ("default_product_payment_on_delivery", models.BooleanField(default=False)),
                ("default_max_payment_on_delivery", models.DecimalField(blank=True, decimal_places=2, max_digits=20, null=True)),
                ("default_base_shipping_price", models.DecimalField(decimal_places=2, max_digits=20)),
                ("default_shipping_price_per_extra_kilograms", models.DecimalField(decimal_places=2, default=0.0, max_digits=20)),
                ("default_tracking_code_base_url", models.CharField(default="", max_length=500)),
            ],
            options={
                "verbose_name": "Shipping method definition",
                "verbose_name_plural": "Shipping method definitions",
            },
        ),
        migrations.AddField(
            model_name="shippingmethod",
            name="definition",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.PROTECT,
                related_name="store_methods",
                to="order.shippingmethoddefinition",
            ),
        ),
        migrations.RunPython(create_default_definition_and_assign, noop),
        migrations.AlterField(
            model_name="shippingmethod",
            name="definition",
            field=models.ForeignKey(
                on_delete=models.PROTECT,
                related_name="store_methods",
                to="order.shippingmethoddefinition",
            ),
        ),
        migrations.AlterUniqueTogether(
            name="shippingmethod",
            unique_together={("store", "definition")},
        ),
    ]
