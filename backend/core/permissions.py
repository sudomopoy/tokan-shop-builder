from rest_framework import permissions
from account.models import StoreUser


# نام بخش‌های داشبورد برای چک دسترسی
DASHBOARD_SECTIONS = ("products", "users", "orders", "blog", "reviews", "finance", "settings", "menus", "sliders", "media", "pages", "notifications", "subscription")


def is_store_owner(request):
    """کاربر مالک فروشگاه است (level=2 یا store.owner)."""
    store = getattr(request, "store", None)
    if not store or not hasattr(request, "store_user"):
        return False
    su = request.store_user
    return su.level >= 2 or (store.owner_id and store.owner_id == request.user.pk)


def store_user_has_permission(request, section, action):
    """
    section: products, users, orders, blog, ...
    action: read, write, delete
    owner همیشه دسترسی کامل دارد.
    """
    if is_store_owner(request):
        return True
    su = getattr(request, "store_user", None)
    if not su:
        return False
    return su.has_section_permission(section, action)


class IsNotBanned(permissions.IsAuthenticated):
    message = "شما دسترسی لازم برای این عملیات را ندارید. با پشتیبانی تماس بگیرید.."

    def has_permission(self, request, view):
        return super().has_permission(request, view) and not getattr(request.user, "is_banned", False)


class IsStoreCustomer(IsNotBanned):
    """
    دسترسی داشبورد فروشگاه.
    - فروشگاه از middleware (دامنه) یا از اولین فروشگاه کاربر (fallback برای dev/localhost) تعیین می‌شود.
    - اگر اشتراک بیش از ۱۰ روز منقضی شده باشد، فقط مالک فروشگاه (owner) می‌تواند وارد شود.
    """

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False

        store = getattr(request, "store", None)
        store_user = None

        # ۱. اگر store از middleware ست شده و کاربر در آن فروشگاه StoreUser دارد
        if store:
            store_user = (
                StoreUser.objects.filter(store=store.pk, user=request.user.pk)
                .order_by("-level", "-is_admin", "-register_at", "-updated_at")
                .first()
            )

        # ۲. Fallback: اگر کاربر در store فعلی عضو نیست (مثلاً localhost→demo در dev)،
        #    اولین فروشگاهی که کاربر در آن عضو است را انتخاب کن
        if store_user is None:
            store_user = (
                StoreUser.objects.filter(user=request.user.pk)
                .select_related("store")
                .order_by("-level", "-is_admin", "-register_at", "-updated_at")
                .first()
            )
            if store_user:
                store = store_user.store
                request.store = store

        if store_user is None or store is None:
            return False

        # ۳. کاربر مسدود در فروشگاه دسترسی ندارد
        if store_user.is_blocked:
            return False

        # ۴. ادمین غیرفعال (موقت به‌خاطر محدودیت پلن) دسترسی ندارد
        if store_user.level == 1 and store_user.is_admin and not store_user.is_admin_active:
            return False

        # ۵. اگر اشتراک بیش از ۱۰ روز منقضی شده، فقط مالک (owner) می‌تواند وارد داشبورد شود
        if getattr(store, "is_subscription_expired_over_10_days", False):
            if store.owner_id != request.user.pk:
                return False

        request.store = store
        request.store_user = store_user
        return True

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "store"):
            return obj.store.pk == request.store.pk
        return True


class IsStoreOwner(IsStoreCustomer):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
            
        if request.store_user.level < 1:
            return False
            
        if request.method == "POST":
            store_id = request.data.get("store")
            if store_id and store_id != request.store.pk:
                return False

        return True


class IsSuperStoreOwner(IsStoreOwner):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
            
        return request.store_user.level >= 2


class IsStoreOwnerOnly(IsStoreOwner):
    """فقط مالک فروشگاه (owner) - برای مدیریت کاربران، مسدود کردن، تعیین ادمین."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return is_store_owner(request)


class HasUsersReadOrOwner(IsStoreOwner):
    """مالک یا ادمین با دسترسی خواندن کاربران - برای لیست کاربران."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return is_store_owner(request) or store_user_has_permission(request, "users", "read")


class RequiresSectionPermission(IsStoreOwner):
    """
    پایه برای چک دسترسی بر اساس بخش.
    در subclass مقدار section را تنظیم کنید: "products", "users", "orders", "blog"
    """
    section = None

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        if is_store_owner(request):
            return True
        if self.section is None:
            return False
        method = request.method
        if method in ("GET", "HEAD", "OPTIONS"):
            return store_user_has_permission(request, self.section, "read")
        if method in ("POST", "PUT", "PATCH"):
            return store_user_has_permission(request, self.section, "write")
        if method == "DELETE":
            return store_user_has_permission(request, self.section, "delete")
        return False


class HasProductsPermission(RequiresSectionPermission):
    section = "products"


class HasOrdersPermission(RequiresSectionPermission):
    section = "orders"


class HasBlogPermission(RequiresSectionPermission):
    section = "blog"


class HasReservationPermission(RequiresSectionPermission):
    section = "reservation"


class HasReviewsPermission(RequiresSectionPermission):
    section = "reviews"


class HasMediaDeletePermission(IsStoreOwner):
    """برای حذف مدیا: owner یا ادمین با media_delete."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return is_store_owner(request) or store_user_has_permission(request, "media", "delete")


class IsStoreUpdateOwnerOnly(IsStoreOwnerOnly):
    """فقط مالک فروشگاه می‌تواند فروشگاه را ویرایش کند (تنظیمات، ...)."""
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "owner_id"):
            return obj.owner_id == request.user.pk
        return super().has_object_permission(request, view, obj)


class StoreFilterMixin:
    """
    Mixin برای فیلتر خودکار queryset بر اساس store کاربر
    """
    def get_queryset(self):
        queryset = super().get_queryset()

        if hasattr(self.request, "store") and hasattr(queryset.model, "store"):
            return queryset.filter(store=self.request.store)
        return queryset