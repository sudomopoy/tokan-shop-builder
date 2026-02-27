from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Variant, Product, VariantAttribute, VariantAttributeValue
from store.models import Store

@receiver(post_save, sender=Variant)
def update_variant_product(sender, instance, created, **kwargs):
    instance.update_product()


def ensure_default_variant_attributes_for_store(store: Store):
    """
    Ensure default variant attributes exist for a store.

    Create system default attributes for each store (idempotent).
    """
    defaults = [
        {
            "slug": "color",
            "title": "رنگ",
            "display_type": "color",
            "unit": "",
            "is_system": True,
        },
        {
            "slug": "size",
            "title": "سایز",
            "display_type": "text",
            "unit": "",
            "is_system": True,
        },
        {
            "slug": "volume",
            "title": "حجم",
            "display_type": "text",
            "unit": "",
            "is_system": True,
        },
        {
            "slug": "weight",
            "title": "وزن",
            "display_type": "text",
            "unit": "",
            "is_system": True,
        },
    ]

    try:
        attrs_by_slug = {}
        for d in defaults:
            attr, _ = VariantAttribute.objects.get_or_create(
                store=store,
                slug=d["slug"],
                defaults={
                    "title": d["title"],
                    "display_type": d["display_type"],
                    "unit": d["unit"],
                    "is_system": d["is_system"],
                },
            )
            attrs_by_slug[d["slug"]] = attr

        # default reusable values for system attributes
        color_attr = attrs_by_slug.get("color")
        if color_attr:
            VariantAttributeValue.objects.get_or_create(
                store=store,
                attribute=color_attr,
                title="تک رنگ",
                defaults={"code": "#000000"},
            )
        size_attr = attrs_by_slug.get("size")
        if size_attr:
            VariantAttributeValue.objects.get_or_create(
                store=store,
                attribute=size_attr,
                title="تک سایز",
                defaults={"code": "single"},
            )
    except Exception:
        # During migrations, tables may not exist; safely ignore
        return


@receiver(post_save, sender=Store)
def create_defaults_for_new_store(sender, instance: Store, created, **kwargs):
    # Create defaults when a new store is created or ensure on updates
    ensure_default_variant_attributes_for_store(instance)


def ensure_defaults_for_all_stores():
    """Idempotently backfill defaults for all existing stores at startup."""
    try:
        for store in Store.objects.all():
            ensure_default_variant_attributes_for_store(store)
    except Exception:
        # During migrations, tables may not exist; safely ignore
        pass