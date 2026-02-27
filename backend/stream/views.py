"""
نمایش امن استریم ویدیو با تأیید خرید.
لینک مستقیم هرگز در پاسخ API ارسال نمی‌شود؛ فقط URL با توکن.
"""
import os
import requests
from django.http import StreamingHttpResponse, FileResponse, Http404, HttpResponseForbidden
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import ensure_csrf_cookie

from product.models import Product
from order.models import OrderItem
from .utils import verify_stream_token

PAID_STATUSES = ["paid", "processing", "completed", "delivered"]


def _verify_purchase(token: str) -> tuple[Product | None, OrderItem | None]:
    """
    توکن را تأیید و محصول + order_item معتبر را برمی‌گرداند.
    """
    payload = verify_stream_token(token)
    if not payload:
        return None, None
    product_id = payload.get("product_id")
    order_item_id = payload.get("order_item_id")
    store_user_id = payload.get("store_user_id")
    store_id = payload.get("store_id")
    if not all([product_id, order_item_id, store_user_id, store_id]):
        return None, None
    try:
        order_item = OrderItem.objects.select_related("product", "order").get(
            id=order_item_id,
            product_id=product_id,
            order__store_user_id=store_user_id,
            order__store_id=store_id,
            order__status__in=PAID_STATUSES,
        )
        product = order_item.product
        if not product or product.digital_subtype != "streaming":
            return None, None
        return product, order_item
    except OrderItem.DoesNotExist:
        return None, None


@method_decorator(require_GET, name='get')
class StreamPlayView(View):
    """
    پخش استریم با توکن.
    دو حالت: لینک خارجی (proxy) یا ویدیوی آپلودشده (HLS).
    URL: /stream/play/<product_id>/?token=...
    """

    def get(self, request, product_id=None):
        token = request.GET.get("token")
        if not token:
            return HttpResponseForbidden("توکن الزامی است.")

        product, order_item = _verify_purchase(token)
        if not product or not order_item:
            return HttpResponseForbidden("دسترسی مجاز نیست.")
        if product_id and str(product.id) != str(product_id):
            return HttpResponseForbidden("عدم تطابق محصول.")

        # حالت ۱: لینک استریم خارجی
        streaming_url = getattr(product, "streaming_url", None)
        streaming_source = getattr(product, "streaming_source", "external_link") or "external_link"

        if streaming_source == "external_link" and streaming_url:
            return self._proxy_external(streaming_url, request)
        # حالت ۲: ویدیوی آپلودشده (HLS)
        if streaming_source == "uploaded":
            hls_path = getattr(product, "streaming_hls_path", None)
            if hls_path:
                return self._serve_hls_manifest(product, hls_path, token, request)
        return Http404("محتوای استریم یافت نشد.")

    def _proxy_external(self, url: str, request):
        """پراکسی استریم خارجی."""
        headers = {}
        if request.META.get("HTTP_RANGE"):
            headers["Range"] = request.META["HTTP_RANGE"]
        try:
            resp = requests.get(url, stream=True, headers=headers, timeout=30)
            resp.raise_for_status()
        except Exception:
            return HttpResponseForbidden("امکان اتصال به منبع استریم وجود ندارد.")

        response_headers = {}
        for k in ("Content-Type", "Content-Length", "Accept-Ranges"):
            if k in resp.headers:
                response_headers[k] = resp.headers[k]

        def generate():
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    yield chunk

        response = StreamingHttpResponse(
            generate(),
            status=resp.status_code,
            content_type=resp.headers.get("Content-Type", "video/mp4"),
        )
        for k, v in response_headers.items():
            response[k] = v
        response["X-Content-Type-Options"] = "nosniff"
        return response

    def _serve_hls_manifest(self, product, hls_path: str, token: str, request):
        """سرو manifest HLS با بازنویسی آدرس سگمنت‌ها."""
        manifest_path = os.path.join(hls_path, "master.m3u8")
        if not os.path.exists(manifest_path):
            manifest_path = os.path.join(hls_path, "index.m3u8")
        if not os.path.exists(manifest_path):
            files = os.listdir(hls_path) if os.path.isdir(hls_path) else []
            for f in files:
                if f.endswith(".m3u8"):
                    manifest_path = os.path.join(hls_path, f)
                    break
        if not os.path.exists(manifest_path):
            return Http404("فایل HLS یافت نشد.")

        from urllib.parse import quote

        base_url = (
            request.build_absolute_uri(f"/stream/segment/{product.id}/")
            .rstrip("/") + "/?token=" + quote(token, safe="") + "&file="
        )

        with open(manifest_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        # بازنویسی آدرس سگمنت‌ها با توکن برای احراز هویت
        lines = []
        for line in content.split("\n"):
            line_stripped = line.strip()
            if line_stripped and not line_stripped.startswith("#"):
                if not line_stripped.startswith("http"):
                    seg_name = line_stripped.split("?")[0].strip()
                    line_stripped = base_url + quote(seg_name, safe="")
            lines.append(line_stripped)
        body = "\n".join(lines)

        response = StreamingHttpResponse(body, content_type="application/vnd.apple.mpegurl")
        response["Content-Disposition"] = "inline"
        response["X-Content-Type-Options"] = "nosniff"
        return response


@require_GET
def stream_segment_view(request, product_id):
    """
    سرو یک سگمنت HLS با تأیید توکن.
    """
    token = request.GET.get("token")
    file_name = request.GET.get("file")
    if not token or not file_name:
        return HttpResponseForbidden("پارامتر الزامی یافت نشد.")
    if ".." in file_name or "/" in file_name or "\\" in file_name:
        return HttpResponseForbidden("نام فایل نامعتبر است.")

    product, _ = _verify_purchase(token)
    if product and str(product.id) != str(product_id):
        return HttpResponseForbidden("عدم تطابق محصول.")
    if not product:
        return HttpResponseForbidden("دسترسی مجاز نیست.")

    hls_path = getattr(product, "streaming_hls_path", None)
    if not hls_path:
        return Http404()
    seg_path = os.path.join(hls_path, file_name)
    if not os.path.exists(seg_path) or not seg_path.startswith(os.path.abspath(hls_path)):
        return Http404()

    response = FileResponse(open(seg_path, "rb"), content_type="video/MP2T")
    response["Accept-Ranges"] = "bytes"
    response["X-Content-Type-Options"] = "nosniff"
    return response
