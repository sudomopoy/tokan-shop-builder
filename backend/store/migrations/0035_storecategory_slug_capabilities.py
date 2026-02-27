# Generated migration for StoreCategory slug and capabilities

from django.db import migrations, models


def create_default_categories(apps, schema_editor):
    StoreCategory = apps.get_model("store", "StoreCategory")
    existing = list(StoreCategory.objects.all())
    used_slugs = set()
    if existing:
        for cat in existing:
            if cat.slug:
                used_slugs.add(cat.slug)
        for cat in existing:
            if cat.slug:
                continue
            title = cat.title or ""
            title_lower = title.lower()
            if "فیزیک" in title or "physical" in title_lower:
                base_slug, caps = "physical", {"requires_shipping": True, "requires_variants": True}
            elif "دیجیتال" in title or "digital" in title_lower or "غیرفیزیک" in title:
                base_slug, caps = "digital", {
                    "requires_shipping": False,
                    "supports_download": True,
                    "supports_streaming": True,
                    "supports_custom_inputs": True,
                    "requires_variants": False,
                }
            elif "رزرو" in title or "reservation" in title_lower or "booking" in title_lower:
                base_slug, caps = "reservation", {"requires_reservation_flow": True}
            else:
                base_slug, caps = "physical", {"requires_shipping": True, "requires_variants": True}
            slug = base_slug
            suffix = 1
            while slug in used_slugs:
                slug = f"{base_slug}_{suffix}"
                suffix += 1
            used_slugs.add(slug)
            cat.slug = slug
            cat.capabilities = caps
            cat.save()
        return
    StoreCategory.objects.bulk_create([
        StoreCategory(
            title="محصولات فیزیکی",
            slug="physical",
            description="فروشگاه محصولات فیزیکی با ارسال پستی",
            index=1,
            capabilities={"requires_shipping": True, "requires_variants": True},
        ),
        StoreCategory(
            title="محصولات دیجیتال",
            slug="digital",
            description="فروشگاه محصولات غیرفیزیکی (دانلودی، استریمینگ، ثبت درخواست، اکانت)",
            index=2,
            capabilities={
                "requires_shipping": False,
                "supports_download": True,
                "supports_streaming": True,
                "supports_custom_inputs": True,
                "requires_variants": False,
            },
        ),
        StoreCategory(
            title="رزرواسیون",
            slug="reservation",
            description="فروشگاه خدمات رزرو (پزشکان، آرایشگران و...)",
            index=3,
            capabilities={"requires_reservation_flow": True},
        ),
    ])


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0034_domainchangerequest"),
    ]

    operations = [
        migrations.AddField(
            model_name="storecategory",
            name="slug",
            field=models.SlugField(blank=True, max_length=50, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="storecategory",
            name="capabilities",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="مثال: requires_shipping, requires_variants, supports_download, supports_streaming, supports_custom_inputs, requires_reservation_flow",
            ),
        ),
        migrations.RunPython(create_default_categories, migrations.RunPython.noop),
    ]
