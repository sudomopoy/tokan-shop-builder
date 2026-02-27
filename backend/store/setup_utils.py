"""
راه‌اندازی فروشگاه: محاسبه پیشرفت تسک‌ها، استخراج لینک از کد نماد.
"""
import re
from typing import Optional


def extract_badge_link_from_html(html: str) -> Optional[str]:
    """
    از کد HTML نماد اعتماد/ساماندهی، لینک کامل را استخراج می‌کند.
    اگر ورودی از قبل یک لینک معتبر (http/https) است، همان را برمی‌گرداند.
    """
    if not html or not isinstance(html, str):
        return None
    s = html.strip()
    if not s:
        return None
    # اگر از قبل لینک است
    if s.startswith("http://") or s.startswith("https://"):
        return s
    # استخراج href از تگ a: <a href="https://...">...</a>
    m = re.search(r'href\s*=\s*["\']([^"\']+)["\']', s, re.I | re.DOTALL)
    if m:
        url = m.group(1).strip()
        if url.startswith("http://") or url.startswith("https://"):
            return url
    return None


# آیتم‌های سرویس راه‌اندازی اولیه وب‌سایت (توضیحات کامل برای صفحه سفارش)
INITIAL_WEBSITE_SETUP_ITEMS = [
    {"key": "domain", "title": "اتصال به دامنه اصلی", "description": "اتصال فروشگاه شما به دامنه اختصاصی (مثل example.com) به‌جای آدرس اشتراکی. مشتریان شما آدرس حرفه‌ای و قابل اعتماد خواهند دید."},
    {"key": "ssl", "title": "تهیه گواهی SSL", "description": "نصب گواهی SSL برای دامنه شما تا اتصال امن (HTTPS) برقرار شود. این امر برای اعتماد مشتریان و سئو ضروری است."},
    {"key": "enamad", "title": "نصب نماد اعتماد الکترونیکی", "description": "دریافت و نصب نماد اعتماد و ساماندهی بر روی فروشگاه برای افزایش اعتماد و رعایت الزامات قانونی."},
    {"key": "payment", "title": "تنظیم درگاه پرداخت", "description": "پیکربندی درگاه پرداخت آنلاین (زرین‌پال، ملت و...) تا بتوانید پرداخت آنلاین دریافت کنید."},
    {"key": "shipping", "title": "تنظیم روش‌های ارسال", "description": "تعیین روش‌های ارسال (پست پیشتاز، تیپاکس و...) و هزینه ارسال برای محصولات فیزیکی."},
    {"key": "first_product", "title": "ساخت اولین محصول", "description": "افزودن اولین محصول به فروشگاه با تصاویر، قیمت و توضیحات کامل."},
    {"key": "seo", "title": "تنظیم سئو و ابزارهای آنالیز", "description": "تنظیم گوگل آنالیتیکس، گوگل کنسول و گوگل تگ منیجر برای تحلیل ترافیک و بهبود نمایش در نتایج جستجو."},
    {"key": "branding", "title": "تنظیم لوگو و برندینگ", "description": "نصب لوگو و تصاویر برند فروشگاه برای ظاهر حرفه‌ای و یکپارچه."},
    {"key": "subscription", "title": "تهیه اشتراک فروشگاه", "description": "فعال‌سازی اشتراک فروشگاه برای شروع فروش و استفاده از امکانات پلتفرم."},
    {"key": "training", "title": "ویدیو آموزش پنل", "description": "دسترسی به ویدیوهای آموزشی برای یادگیری نحوه کار با پنل مدیریت فروشگاه."},
    {"key": "support", "title": "۱ ماه پشتیبانی رایگان", "description": "یک ماه پشتیبانی تخصصی برای رفع سوالات و مشکلات در مسیر راه‌اندازی."},
]

# کلیدهای تسک‌های راه‌اندازی و مسیر راهنما
SETUP_TASKS = [
    {"key": "domain", "label": "اتصال به دامنه اصلی", "guide_path": "/dashboard/setup/domain", "optional": False, "icon": "globe"},
    {"key": "enamad", "label": "نصب نماد اعتماد", "guide_path": "/dashboard/setup/enamad", "optional": False, "icon": "shield-check"},
    {"key": "payment", "label": "تنظیم درگاه پرداخت", "guide_path": "/dashboard/setup/payment", "optional": False, "icon": "credit-card"},
    {"key": "shipping", "label": "تنظیم روش‌های ارسال", "guide_path": "/dashboard/setup/shipping", "optional": False, "icon": "truck"},
    {"key": "first_product", "label": "ساخت اولین محصول", "guide_path": "/dashboard/setup/first-product", "optional": False, "icon": "package"},
    {"key": "google_search_console", "label": "تنظیم گوگل کنسول", "guide_path": "/dashboard/setup/google-search-console", "optional": True, "icon": "search"},
    {"key": "google_analytics", "label": "نصب گوگل آنالیتیکس", "guide_path": "/dashboard/setup/google-analytics", "optional": True, "icon": "bar-chart"},
    {"key": "google_tag_manager", "label": "نصب گوگل تگ منیجر", "guide_path": "/dashboard/setup/google-tag-manager", "optional": True, "icon": "layers"},
    {"key": "first_blog", "label": "ساخت اولین بلاگ", "guide_path": "/dashboard/setup/first-blog", "optional": True, "icon": "book-open"},
    {"key": "torob", "label": "اتصال به ترب", "guide_path": "/dashboard/setup/torob", "optional": True, "icon": "link"},
    {"key": "branding", "label": "تنظیم لوگو و برندینگ", "guide_path": "/dashboard/setup/branding", "optional": True, "icon": "image"},
    {"key": "subscription", "label": "تهیه اشتراک", "guide_path": "/dashboard/setup/subscription", "optional": False, "icon": "credit-card"},
    {"key": "start_selling", "label": "شروع فروش!", "guide_path": "/dashboard/setup/start-selling", "optional": False, "icon": "rocket"},
]
