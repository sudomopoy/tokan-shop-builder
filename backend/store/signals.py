from django.db.models.signals import post_save
from django.dispatch import receiver
from store.models import Store, SettingDefinition, StoreSetting
from store.infrastructure.dns import create_cname_record
from order.models import ShippingMethod, ShippingMethodDefinition
from media.models import Media
from django.conf import settings
import time
from account.models import StoreUser

def _create_shipping_methods_for_store(store):
    """Create one ShippingMethod per ShippingMethodDefinition for this store."""
    for definition in ShippingMethodDefinition.objects.all():
        post_logo = Media.objects.filter(title="لوگو اداره پست").first() if definition.slug == "post-pishtaz" else None
        ShippingMethod.objects.get_or_create(
            store=store,
            definition=definition,
            defaults={
                "logo": post_logo,
                "name": definition.name,
                "description": definition.description or "",
                "shipping_payment_on_delivery": definition.default_shipping_payment_on_delivery,
                "product_payment_on_delivery": definition.default_product_payment_on_delivery,
                "max_payment_on_delivery": definition.default_max_payment_on_delivery,
                "base_shipping_price": definition.default_base_shipping_price,
                "shipping_price_per_extra_kilograms": definition.default_shipping_price_per_extra_kilograms,
                "tracking_code_base_url": definition.default_tracking_code_base_url or "",
            },
        )

def _invalidate_store_theme_cache_on_save(sender, instance, created, update_fields=None, **kwargs):
    """Invalidate theme_slug cache when Store is updated (API, admin, or bulk)."""
    if created:
        return
    try:
        from page.views import invalidate_store_theme_slug_cache
        invalidate_store_theme_slug_cache(instance.id)
    except Exception:
        pass


def _invalidate_cors_domains_cache(sender, instance, created, update_fields=None, **kwargs):
    """Invalidate CORS allowed-domains cache when external_domain or is_active changes."""
    if not created and update_fields and "external_domain" not in update_fields and "is_active" not in update_fields:
        return
    try:
        from django.core.cache import cache
        from core.middleware import CORS_ACTIVE_STORE_DOMAINS_CACHE_KEY, CORS_SUPER_STORE_DOMAIN_CACHE_KEY
        cache.delete(CORS_ACTIVE_STORE_DOMAINS_CACHE_KEY)
        if instance._is_super_store and (not update_fields or "external_domain" in update_fields):
            cache.delete(CORS_SUPER_STORE_DOMAIN_CACHE_KEY)
    except Exception:
        pass


@receiver(post_save, sender=Store)
def create_store_needs(sender,instance,created,update_fields, **kwargs):
    if created and not update_fields:
        StoreUser.objects.create(
            store=instance,
            user= instance.owner,
            level=2,
            is_admin=True,
            is_vendor=True,
        )
        definitions = SettingDefinition.objects.all()
        StoreSetting.objects.bulk_create(
            [
                StoreSetting(
                    definition=define, 
                    value=define.default_value,
                    store=instance
                )
                for define in definitions
            ]
        )
        # Payment: one PaymentGateway per PaymentGatewayType (definition + store settings)
        from payment.models import PaymentGatewayType, PaymentGateway
        for gateway_type in PaymentGatewayType.objects.all():
            PaymentGateway.objects.get_or_create(
                store=instance,
                gateway_type=gateway_type,
                defaults={
                    "title": gateway_type.title,
                    "configuration": {},
                    "is_sandbox": False,
                },
            )
        # Shipping: one ShippingMethod per ShippingMethodDefinition
        _create_shipping_methods_for_store(instance)
        if not instance._dns_record_id and not settings.DEBUG_STORE:
            for _ in range(3):
                dns_id = create_cname_record(
                    domain="tokan.app",
                    name=instance.name,
                    host="c11.hamravesh.onhamravesh.ir",
                    cloud=True,
                )
                if dns_id:
                    instance._dns_record_id = dns_id
                    instance.save()
                    break
                print("fail to set dns record for: ", instance.name)
                time.sleep(3)
                
    if not created:
        # Ensure store has one ShippingMethod per ShippingMethodDefinition
        _create_shipping_methods_for_store(instance)
        # Invalidate theme cache when store is updated (e.g. theme changed in admin)
        _invalidate_store_theme_cache_on_save(sender, instance, created, update_fields, **kwargs)
        # Invalidate CORS cache when external_domain/is_active changes
        _invalidate_cors_domains_cache(sender, instance, created, update_fields, **kwargs)
        # وقتی پلن اشتراک عوض شد، تعداد ادمین‌ها را با محدودیت پلن تطبیق بده
        if update_fields is None or "subscription_plan" in (update_fields or set()):
            from account.admin_utils import reconcile_store_admins_for_plan
            reconcile_store_admins_for_plan(instance)


from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from .models import SettingDefinition, StoreSetting, Store


@receiver(post_save, sender=SettingDefinition)
def handle_setting_definition_changes(sender, instance, created, **kwargs):
    """
    Handle creation, updates of setting definitions and ensure all stores have the setting
    """
   
    stores = Store.objects.all()

    if created:
        # For new setting definitions, create StoreSetting for all stores
        store_settings = [
            StoreSetting(store=store, definition=instance, value=instance.default_value)
            for store in stores
        ]
        StoreSetting.objects.bulk_create(store_settings)
    else:
        # For updates, ensure all stores have this setting
        with transaction.atomic():
            # Find stores that don't have this setting yet
            stores_without_setting = stores.exclude(settings__definition=instance)

            # Create missing settings for these stores
            missing_settings = [
                StoreSetting(
                    store=store, definition=instance, value=instance.default_value
                )
                for store in stores_without_setting
            ]
            StoreSetting.objects.bulk_create(missing_settings)

            # Update existing settings where applicable
            existing_settings = StoreSetting.objects.filter(
                definition=instance
            ).select_related("store")

            for store_setting in existing_settings:
                if not instance.can_edit_by_store or not store_setting.value:
                    store_setting.value = instance.default_value
                    store_setting.save()


@receiver(post_delete, sender=SettingDefinition)
def delete_store_settings_on_definition_delete(sender, instance, **kwargs):
    """
    When a SettingDefinition is deleted, delete all related store settings.
    """
    if settings.DEBUG_STORE:
        return
    StoreSetting.objects.filter(definition=instance).delete()
