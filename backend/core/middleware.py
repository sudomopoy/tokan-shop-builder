from django.http import HttpResponseForbidden, HttpResponse, HttpResponseRedirect
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q
from urllib.parse import urlparse
from django.conf import settings
import threading
from store.models import Store

_request_local = threading.local()

# Constants
EXCLUDED_PATHS = [
    "/admin",
    "/swagger",
    "/redoc",
    "/data",
]
SUPER_STORE_PANEL_DOMAIN = "panel.tokan.app"
# Panel / localhost - no store context
NO_STORE_DOMAINS = {"panel.tokan.app", "localhost", "127.0.0.1"}


def get_current_request():
    """Get the current request from thread local storage."""
    return getattr(_request_local, "request", None)


def extract_domain(url, remove_www=True):
    """Extract and clean domain from URL. Strips protocol and port."""
    if not url.startswith(("http://", "https://")):
        url = "//" + url

    parsed = urlparse(url)
    host = parsed.netloc or parsed.path.split("/")[0]

    # Strip credentials if present (user:pass@host)
    host = host.split("@")[-1]

    # Remove port if present
    domain = host.split(":")[0]

    if remove_www and domain.startswith("www."):
        domain = domain[4:]

    return domain


CORS_ACTIVE_STORE_DOMAINS_CACHE_KEY = "cors_active_store_domains"
CORS_SUPER_STORE_DOMAIN_CACHE_KEY = "cors_super_store_domain"
CORS_ACTIVE_STORE_DOMAINS_TTL = 300  # 5 minutes


def get_super_store_domain():
    """Return super_store.external_domain (e.g. tokan.app, mytoken.ir). Cached."""
    from django.core.cache import cache

    domain = cache.get(CORS_SUPER_STORE_DOMAIN_CACHE_KEY)
    if domain is not None:
        return domain

    try:
        super_store = Store.objects.get(_is_super_store=True)
        domain = (super_store.external_domain or "").strip().lower()
        for prefix in ("https://", "http://", "www."):
            if domain.startswith(prefix):
                domain = domain[len(prefix) :]
        if domain:
            cache.set(CORS_SUPER_STORE_DOMAIN_CACHE_KEY, domain, CORS_ACTIVE_STORE_DOMAINS_TTL)
    except Store.DoesNotExist:
        domain = ""
    return domain or ""


def is_subdomain_of_super_store(origin_domain):
    """Check if origin_domain is a subdomain of super_store (e.g. storename.tokan.app)."""
    super_domain = get_super_store_domain()
    if not super_domain:
        return False
    origin_domain = origin_domain.lower()
    # Subdomain: storename.tokan.app (must end with .super_domain and not equal to super_domain)
    if origin_domain == super_domain or origin_domain == f"www.{super_domain}":
        return True
    if origin_domain.endswith(f".{super_domain}") and origin_domain != super_domain:
        return True
    return False


def get_active_store_external_domains():
    """
    Return set of external domains for active stores. Cached for performance.
    """
    from django.core.cache import cache

    domains = cache.get(CORS_ACTIVE_STORE_DOMAINS_CACHE_KEY)
    if domains is not None:
        return domains

    domains = set(
        Store.objects.filter(is_active=True)
        .exclude(external_domain__isnull=True)
        .exclude(external_domain="")
        .values_list("external_domain", flat=True)
    )
    # Normalize: strip protocol, www, lowercase
    normalized = set()
    for d in domains:
        if not d or not isinstance(d, str):
            continue
        d = d.strip().lower()
        for prefix in ("https://", "http://", "www."):
            if d.startswith(prefix):
                d = d[len(prefix) :]
        if d:
            normalized.add(d)
            normalized.add(f"www.{d}")  # allow both with and without www

    cache.set(CORS_ACTIVE_STORE_DOMAINS_CACHE_KEY, normalized, CORS_ACTIVE_STORE_DOMAINS_TTL)
    return normalized


class DynamicCorsMiddleware:
    """
    Allows CORS for origins that CorsMiddleware's regexes don't cover:
    1. external domains of active stores (from DB, cached).
    2. subdomain origins (*.super_store.external_domain e.g. storename.tokan.app).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        origin = request.META.get("HTTP_ORIGIN")
        if not origin:
            return response

        if response.get("Access-Control-Allow-Origin"):
            return response

        origin_domain = extract_domain(origin)
        allowed_domains = get_active_store_external_domains()
        is_allowed = origin_domain.lower() in allowed_domains or is_subdomain_of_super_store(origin_domain)
        if not is_allowed:
            return response

        response["Access-Control-Allow-Origin"] = origin
        response["Access-Control-Allow-Credentials"] = "true"
        if request.method == "OPTIONS":
            response["Access-Control-Allow-Methods"] = response.get(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            )
            response["Access-Control-Allow-Headers"] = response.get(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Store-Host",
            )
        return response


class StoreDomainMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def _handle_options_request(self):
        """Handle OPTIONS requests for CORS."""
        response = HttpResponse()
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Store-Host"
        return response

    def _validate_store_access(self, store):
        """Validate if store is accessible."""
        if store.is_banned:
            return HttpResponseForbidden("Store is banned")
        if not store.is_active:
            return HttpResponseForbidden("Store is not active")
        return None

    def _validate_store_ownership(self, request, store):
        """Validate store ownership for write operations."""
        if request.method in ["POST", "PUT", "PATCH"]:
            # Prefer DRF Request.data when available (Request wrapper sets .data).
            # For Django's WSGIRequest (e.g. PUT/PATCH with application/json),
            # parse request.body as JSON. Fall back to request.POST for form data.
            data = None
            if request.method == "POST":
                data = request.POST
            else:
                # Try DRF-style .data first
                if hasattr(request, "data"):
                    data = request.data
                else:
                    # If content is JSON, parse the raw body
                    content_type = request.META.get("CONTENT_TYPE", "")
                    if content_type.startswith("application/json"):
                        try:
                            import json

                            data = json.loads(request.body.decode("utf-8") or "{}")
                        except Exception:
                            data = {}
                    else:
                        # As a last resort, use POST (for form-encoded bodies)
                        data = request.POST

            if isinstance(data, dict) and "store" in data and int(data["store"]) != store.id:
                return HttpResponseForbidden(
                    "You can only create/modify resources for your own store."
                )
        return None

    def _get_store_from_origin(self, origin):
        """
        Get store based on origin domain.

        Resolution order:
        1. Panel domain (panel.tokan.app) -> None
        2. Custom external_domain: stores with their own domain (e.g. mystore.com)
        3. Subdomain of super_store: storename.tokan.app -> store by name + super_store
        """
        origin = extract_domain(origin)
        if not origin:
            raise ObjectDoesNotExist("Empty origin")
        origin = origin.lower()

        # Panel / localhost - no store
        if origin in NO_STORE_DOMAINS:
            return None

        super_store = Store.objects.get(_is_super_store=True)
        super_domain = (super_store.external_domain or "").lower()

        # 1. دامنه اصلی super_store (tokan.app) = super_store برای auth و لندینگ
        if super_domain and (origin == super_domain or origin == f"www.{super_domain}"):
            return super_store

        # 2. Lookup by custom external_domain (External domain Store ها)
        #    Supports both "mystore.com" and "www.mystore.com" in DB
        store_by_external = Store.objects.filter(
            Q(external_domain__iexact=origin) | Q(external_domain__iexact=f"www.{origin}")
        ).first()
        if store_by_external:
            return store_by_external

        # 3. Subdomain of super_store (e.g. storename.tokan.app)
        if super_domain and origin.endswith(f".{super_domain}") and origin != super_domain:
            store_name = origin[: -len(super_domain) - 1]  # strip ".tokan.app"
            return Store.objects.get(name=store_name, super_store=super_store)

        raise ObjectDoesNotExist(f"No store found for domain: {origin}")

    def __call__(self, request):
        # Skip processing for excluded paths or handle DEBUG with best-effort origin resolution
        if settings.DEBUG_STORE:
            try:
                origin = (
                    request.headers.get("X-Store-Host")
                    or request.headers.get("X-Forwarded-Host")
                    or request.headers.get("Origin")
                    or request.headers.get("Host")
                    or request.headers.get("Referer")
                )
                if origin:
                    store = self._get_store_from_origin(origin)
                    if store is not None:
                        request.store = store
                if not hasattr(request, "store"):
                    # Fallback to super store if available, otherwise demo by name
                    try:
                        request.store = Store.get_super_store()
                    except Exception:
                        request.store = Store.objects.get(name="demo")
            except Exception:
                try:
                    request.store = Store.objects.get(name="demo")
                except Exception:
                    pass
            _request_local.request = request
            return self.get_response(request)
            
        if request.method == "OPTIONS":
            return self._handle_options_request()
            
        if any(request.path.startswith(path) for path in EXCLUDED_PATHS):
            _request_local.request = request
            return self.get_response(request)

        try:
            # Get origin from headers (X-Store-Host for server-side forwarding)
            origin = (
                request.headers.get("X-Store-Host")
                or request.headers.get("X-Forwarded-Host")
                or request.headers.get("Origin")
                or request.headers.get("Host")
                or request.headers.get("Referer")
            )
            
            if not origin:
                return HttpResponseForbidden("No store found for this domain.")
            origin_domain = extract_domain(origin)
            store = self._get_store_from_origin(origin)
            if store is None:  # Panel domain case
                _request_local.request = request
                return self.get_response(request)

            # اگر فروشگاه دامنه اختصاصی دارد و درخواست از آدرس اشتراکی (زیردامنه) آمده، ریدایرکت به دامنه اصلی
            super_store = store.super_store
            shared_subdomain = f"{store.name}.{super_store.external_domain}" if super_store and super_store.external_domain else None
            if (
                store.external_domain
                and store.external_domain.strip()
                and shared_subdomain
                and origin_domain.lower() == shared_subdomain.lower()
            ):
                redirect_url = f"https://{store.external_domain.lstrip('https://').lstrip('http://')}"
                return HttpResponseRedirect(redirect_url)

            # Validate store access
            if error_response := self._validate_store_access(store):
                return error_response
                
            # Set store on request
            request.store = store
            _request_local.request = request
            
            # Validate store ownership for write operations
            if error_response := self._validate_store_ownership(request, store):
                return error_response
                
            # Set store filter for GET requests
            if request.method == "GET":
                request.store_filter = {"store": store}

        except ObjectDoesNotExist:
            if settings.DEBUG:
                request.store = Store.get_super_store()
                _request_local.request = request
                return self.get_response(request)
            return HttpResponseForbidden("No store found for this domain.")

        response = self.get_response(request)
        return response