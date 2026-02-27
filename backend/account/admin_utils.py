"""
توابع کمکی برای مدیریت ادمین‌های فروشگاه، محصولات و محدودیت‌های پلن.
"""
from django.utils import timezone

from account.models import StoreUser


def get_store_effective_plan(store):
    """پلن مؤثر فروشگاه: اگر اشتراک منقضی شده باشد، پلن پیش‌فرض برگردانده می‌شود."""
    from subscription.models import SubscriptionPlan

    if not store:
        return None
    plan = getattr(store, "subscription_plan", None)
    expires_at = getattr(store, "subscription_expires_at", None)
    if expires_at and timezone.now() > expires_at:
        return SubscriptionPlan.get_default()
    return plan


def get_store_max_products(store):
    """حداکثر تعداد محصول مجاز بر اساس پلن مؤثر فروشگاه. None = نامحدود."""
    plan = get_store_effective_plan(store)
    if not plan:
        return 0
    max_products = getattr(plan, "max_products", None)
    if max_products is None:
        return None  # نامحدود
    return max_products


def get_store_max_admins(store):
    """حداکثر تعداد ادمین مجاز بر اساس پلن اشتراک فروشگاه."""
    plan = getattr(store, "subscription_plan", None)
    if not plan:
        return 0
    return getattr(plan, "max_admins", 0) or 0


def get_store_active_admin_count(store):
    """تعداد ادمین‌های فعال (is_admin=True, level=1, نه owner)."""
    return StoreUser.objects.filter(
        store=store,
        is_admin=True,
        level=1,
    ).exclude(user_id=store.owner_id).count()


def reconcile_store_admins_for_plan(store):
    """
    وقتی پلن فروشگاه عوض می‌شود فراخوانی می‌شود.
    اگر تعداد ادمین‌های فعال بیشتر از max_admins باشد،
    همه ادمین‌ها را موقتاً غیرفعال می‌کند (is_admin_active=False).
    دسترسی‌ها حفظ می‌شوند.
    """
    max_allowed = get_store_max_admins(store)
    admins = StoreUser.objects.filter(
        store=store,
        is_admin=True,
        level=1,
    ).exclude(user_id=store.owner_id)

    count = admins.count()
    if count > max_allowed:
        admins.update(is_admin_active=False)


def reconcile_store_products_for_plan(store):
    """
    وقتی پلن فروشگاه منقضی می‌شود یا به پلنی با تعداد محصولات کمتر تغییر می‌کند
    فراخوانی می‌شود. اگر تعداد محصولات بیشتر از max_products باشد،
    همه محصولات را موقتاً غیرفعال می‌کند تا پلن تعیین تکلیف شود.
    """
    from product.models import Product

    max_allowed = get_store_max_products(store)
    if max_allowed is None:
        return  # نامحدود، نیازی به تغییر نیست
    product_count = Product.objects.filter(store=store).count()
    if product_count > max_allowed:
        Product.objects.filter(store=store).update(is_active=False)
