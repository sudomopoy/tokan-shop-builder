"""
بررسی دامنه‌های مجاز CORS برای دیباگ.

استفاده:
  python manage.py debug_cors
  python manage.py debug_cors --origin "https://mystore.com"
"""
from django.core.management.base import BaseCommand
from django.core.cache import cache

from core.middleware import (
    get_active_store_external_domains,
    extract_domain,
    is_subdomain_of_super_store,
    get_super_store_domain,
    CORS_ACTIVE_STORE_DOMAINS_CACHE_KEY,
    CORS_SUPER_STORE_DOMAIN_CACHE_KEY,
)
from store.models import Store


class Command(BaseCommand):
    help = "نمایش دامنه‌های مجاز CORS و بررسی یک origin"

    def add_arguments(self, parser):
        parser.add_argument("--origin", type=str, help="Origin برای بررسی (مثل https://mystore.com یا https://store.tokan.app)")
        parser.add_argument("--invalidate", action="store_true", help="پاک کردن کش CORS")

    def handle(self, *args, **options):
        if options.get("invalidate"):
            cache.delete(CORS_ACTIVE_STORE_DOMAINS_CACHE_KEY)
            cache.delete(CORS_SUPER_STORE_DOMAIN_CACHE_KEY)
            self.stdout.write(self.style.SUCCESS("کش CORS پاک شد."))
            return

        super_domain = get_super_store_domain()
        self.stdout.write(f"دامنه super_store: {super_domain!r} (زیردامنه‌ها: *.{super_domain})")

        stores = list(
            Store.objects.filter(is_active=True)
            .exclude(external_domain__isnull=True)
            .exclude(external_domain="")
            .values_list("name", "external_domain", "is_active")
        )
        self.stdout.write(f"\nفروشگاه‌های فعال با external_domain: {len(stores)}")
        for name, domain, active in stores:
            self.stdout.write(f"  - {name}: {domain!r} (active={active})")

        allowed = get_active_store_external_domains()
        self.stdout.write(f"\nدامنه‌های external مجاز CORS: {len(allowed)}")
        for d in sorted(allowed):
            self.stdout.write(f"  - {d}")

        origin = options.get("origin")
        if origin:
            domain = extract_domain(origin)
            ok_external = domain.lower() in allowed
            ok_subdomain = is_subdomain_of_super_store(domain)
            ok = ok_external or ok_subdomain
            self.stdout.write(f"\nبررسی origin={origin!r}")
            self.stdout.write(f"  استخراج شده: {domain!r}")
            self.stdout.write(f"  external_domain: {'بله' if ok_external else 'خیر'}")
            self.stdout.write(f"  subdomain (*.{super_domain}): {'بله' if ok_subdomain else 'خیر'}")
            if ok:
                self.stdout.write(self.style.SUCCESS("  مجاز CORS: بله"))
            else:
                self.stdout.write(self.style.ERROR("  مجاز CORS: خیر"))
