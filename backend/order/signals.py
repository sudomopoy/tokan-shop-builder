"""
When a new ShippingMethodDefinition is created, create a ShippingMethod (store settings)
for every existing store so all stores have all shipping method options.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import ShippingMethodDefinition, ShippingMethod
from store.models import Store


@receiver(post_save, sender=ShippingMethodDefinition)
def create_store_shipping_methods_for_definition(sender, instance, created, **kwargs):
    if created:
        methods = [
            ShippingMethod(
                store=store,
                definition=instance,
                name=instance.name,
                description=instance.description or "",
                shipping_payment_on_delivery=instance.default_shipping_payment_on_delivery,
                product_payment_on_delivery=instance.default_product_payment_on_delivery,
                max_payment_on_delivery=instance.default_max_payment_on_delivery,
                base_shipping_price=instance.default_base_shipping_price,
                shipping_price_per_extra_kilograms=instance.default_shipping_price_per_extra_kilograms,
                tracking_code_base_url=instance.default_tracking_code_base_url or "",
            )
            for store in Store.objects.all()
        ]
        ShippingMethod.objects.bulk_create(methods)
