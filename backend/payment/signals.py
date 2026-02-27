"""
When a new PaymentGatewayType (definition) is created, create a PaymentGateway
(store settings) for every existing store so all stores have all payment method options.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import PaymentGatewayType, PaymentGateway
from store.models import Store


@receiver(post_save, sender=PaymentGatewayType)
def create_store_payment_gateways_for_definition(sender, instance, created, **kwargs):
    if created:
        gateways = [
            PaymentGateway(
                store=store,
                gateway_type=instance,
                title=instance.title,
                configuration={},
                is_sandbox=False,
            )
            for store in Store.objects.all()
        ]
        PaymentGateway.objects.bulk_create(gateways)
