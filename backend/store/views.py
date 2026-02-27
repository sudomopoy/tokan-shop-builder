from rest_framework import viewsets
from store.serializers import StoreSerializer, StoreCategorySerializer
from store.models import Store, StoreCategory
from rest_framework.response import Response
from store.models import is_valid_subdomain
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class StoresViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Store.objects.all()
    lookup_field = "internal_domain"
    serializer_class = StoreSerializer
    pagination_class = None 

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(request.store)
        return Response(serializer.data)


import re
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Store, DomainChangeRequest
from .serializers import StoreSerializer, StoreCreateSerializer, StoreUpdateSerializer
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from store import serializers

from rest_framework.permissions import AllowAny
from core.permissions import IsStoreCustomer, IsStoreOwnerOnly, IsStoreUpdateOwnerOnly


class StoreCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """لیست دسته‌بندی‌های فروشگاه برای فرم راه‌اندازی"""
    queryset = StoreCategory.objects.all().order_by("index", "title")
    serializer_class = StoreCategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None


class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return StoreCreateSerializer
        if self.action in ("update", "partial_update"):
            return StoreUpdateSerializer
        return StoreSerializer

    def _preprocess_request_data(self, data):
        """Resolve theme_slug to theme id for PATCH payload."""
        if not isinstance(data, dict):
            return data
        theme_slug = data.pop("theme_slug", None)
        if theme_slug is not None:
            from page.models import Theme
            slug = (str(theme_slug) or "default").strip() or "default"
            theme = Theme.objects.filter(slug=slug).first()
            # Only set theme if found - avoid clearing when slug doesn't exist in DB
            if theme:
                data["theme"] = str(theme.id)
        return data
    def get_permissions(self):
        if self.action in ['check_store_name']:
            return [AllowAny()]
        if self.action in ('update', 'partial_update', 'update_settings'):
            return [IsStoreCustomer(), IsStoreUpdateOwnerOnly()]
        return super().get_permissions()
    def perform_create(self, serializer):
        # Set the owner to the current user if not provided
        if "owner" not in serializer.validated_data:
            serializer.validated_data["owner"] = self.request.user
        if not self.request.user.is_superuser and Store.objects.filter(owner=self.request.user).count() >= 5:
            raise ValidationError({'error': "شما به تعداد حداکثر فروشگاه مجاز رسیده اید."})
        # Ensure the current store (if any) is a super store for new stores
        current_store = getattr(self.request, "store", None)
        if current_store and current_store._is_super_store:
            serializer.validated_data["super_store"] = current_store

        store = serializer.save()
        # ایجاد صفحات اولیه فروشگاه
        try:
            from page.views import PageViewSet
            from account.models import StoreUser

            if StoreUser.objects.filter(store=store, user=self.request.user, level__gte=1).exists():
                setup_view = PageViewSet()
                setup_view.request = self.request
                setup_view.request.store = store
                setup_view.request.store_user = StoreUser.objects.get(store=store, user=self.request.user)
                setup_view.setup_defaults(self.request)
        except Exception:
            pass

    def get_serializer(self, *args, **kwargs):
        if self.action in ("update", "partial_update") and "data" in kwargs:
            kwargs["data"] = self._preprocess_request_data(dict(kwargs["data"]))
        return super().get_serializer(*args, **kwargs)

    def perform_update(self, serializer):
        # Prevent changing super store status unless user is superuser
        if "_is_super_store" in serializer.validated_data:
            if not self.request.user.is_superuser:
                raise serializers.ValidationError(
                    "Only superusers can change super store status."
                )

        old_theme_id = getattr(serializer.instance, "theme_id", None) if serializer.instance else None
        serializer.save()
        new_theme_id = getattr(serializer.instance, "theme_id", None)

        if "theme" in serializer.validated_data and old_theme_id != new_theme_id:
            from page.views import invalidate_store_theme_slug_cache
            invalidate_store_theme_slug_cache(serializer.instance.id)
            from notification.utils import create_system_announcement
            create_system_announcement(
                store_id=serializer.instance.id,
                title="فرآیند تغییر تم فروشگاه آغاز شد",
                message="اعمال تم جدید ممکن است تا ۱۰ دقیقه طول بکشد.",
                notification_type="info",
                source="system",
            )

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_superuser:
            return queryset

        user = self.request.user
        current_store = getattr(self.request, "store", None)

        # Stores user owns
        owned = queryset.filter(owner=user)
        # Stores under user's super_store (when user owns super_store)
        under_super = queryset.none()
        if current_store and current_store._is_super_store:
            under_super = queryset.filter(super_store=current_store)
        # Stores where user is StoreUser with level >= 1 (admin/manager) - can edit
        from account.models import StoreUser
        store_ids_with_access = StoreUser.objects.filter(
            user=user, level__gte=1
        ).values_list("store_id", flat=True)
        as_store_user = queryset.filter(pk__in=store_ids_with_access)

        return (owned | under_super | as_store_user).distinct()

    @action(detail=False, methods=["get"])
    def my_stores(self, request):
        """Get stores owned by the current user"""
        stores = Store.objects.filter(owner=request.user)
        serializer = self.get_serializer(stores, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="my-accessible-stores")
    def my_accessible_stores(self, request):
        """فروشگاه‌های قابل دسترسی کاربر (مالک + ادمین) - برای پنل مدیریت"""
        from account.models import StoreUser
        owned_ids = list(Store.objects.filter(owner=request.user).values_list("pk", flat=True))
        admin_ids = list(
            StoreUser.objects.filter(user=request.user, level__gte=1)
            .values_list("store_id", flat=True)
            .distinct()
        )
        store_ids = list(set(owned_ids) | set(admin_ids))
        stores = Store.objects.filter(pk__in=store_ids).order_by("name")
        data = []
        for s in stores:
            is_owner = s.owner_id == request.user.pk
            data.append({
                **self.get_serializer(s).data,
                "is_owner": is_owner,
                "is_admin": not is_owner,
            })
        return Response(data)

    @action(detail=False, methods=["get"])
    def current(self, request):
        """Get current store from request context (domain)"""
        store = getattr(request, "store", None)
        if not store:
            return Response(
                {"detail": "فروشگاهی در این دامنه یافت نشد."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(store)
        return Response(serializer.data)

    def _get_setting_value(self, store, key):
        """Get store setting value by key."""
        from store.models import StoreSetting, SettingDefinition
        try:
            defn = SettingDefinition.objects.get(key=key)
            s = StoreSetting.objects.filter(store=store, definition=defn).first()
            v = (s.value if s else defn.default_value or "").strip()
            return v if v else None
        except SettingDefinition.DoesNotExist:
            return None

    @action(detail=False, methods=["get"], url_path="setup-progress")
    def setup_progress(self, request):
        """
        پیشرفت راه‌اندازی فروشگاه: لیست تسک‌ها و وضعیت هر کدام.
        اگر SmartSetupRequest با status=done وجود داشته باشد، همه done برمی‌گردند.
        """
        store = getattr(request, "store", None)
        if not store:
            su = __import__("account.models", fromlist=["StoreUser"]).StoreUser
            su_obj = su.objects.filter(user=request.user, level__gte=1).select_related("store").order_by("-level").first()
            store = su_obj.store if su_obj else None
        if not store:
            return Response({"detail": "فروشگاهی یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        from store.models import SmartSetupRequest
        from store.setup_utils import SETUP_TASKS

        smart_done = SmartSetupRequest.objects.filter(
            store=store, status=SmartSetupRequest.STATUS_DONE
        ).exists()

        if smart_done:
            tasks = [
                {"key": t["key"], "label": t["label"], "guide_path": t["guide_path"], "optional": t["optional"], "done": True}
                for t in SETUP_TASKS
            ]
            domain_req = DomainChangeRequest.objects.filter(
                store=store, status=DomainChangeRequest.STATUS_PENDING
            ).first()
            domain_change_message = None
            if domain_req:
                domain_change_message = (
                    f"درخواست تغییر دامنه به {domain_req.requested_domain} ثبت شده. "
                    "لطفاً نام‌سرورهای دامنه خود را به موارد زیر تنظیم کنید: c.ns.arvancdn.ir و n.ns.arvancdn.ir. "
                    "پس از تنظیم، درخواست شما توسط پشتیبانی بررسی و تایید خواهد شد."
                )
            return Response({
                "tasks": tasks,
                "smart_setup_completed": True,
                "smart_setup_pending": False,
                "smart_setup_current_stage": None,
                "store_id": str(store.id),
                "domain_change_pending": domain_req is not None,
                "domain_change_message": domain_change_message,
                "domain_change_request_id": str(domain_req.id) if domain_req else None,
            })

        # Compute each task from store state
        enamad_url = self._get_setting_value(store, "trust_enamad_url")
        samandehi_url = self._get_setting_value(store, "trust_samandehi_url")
        ga = self._get_setting_value(store, "google_analytics_id")
        gtm = self._get_setting_value(store, "google_tag_manager_id")
        torob_url = self._get_setting_value(store, "torob_api_url")
        gsc = self._get_setting_value(store, "google_search_console_verified")

        from django.db.models import Count
        products_count = __import__("product.models", fromlist=["Product"]).Product.objects.filter(store=store).count()
        articles_count = __import__("article.models", fromlist=["Article"]).Article.objects.filter(store=store).count()

        gw_configured = False
        try:
            from payment.models import PaymentGateway
            for gw in PaymentGateway.objects.filter(store=store):
                if gw.configuration and isinstance(gw.configuration, dict) and any(gw.configuration.values()):
                    gw_configured = True
                    break
        except Exception:
            pass

        shipping_configured = False
        try:
            from order.models import ShippingMethod
            shipping_configured = ShippingMethod.objects.filter(store=store, is_active=True).exists()
        except Exception:
            pass

        from django.utils import timezone
        sub_active = bool(
            store.subscription_expires_at
            and store.subscription_expires_at > timezone.now()
        )

        task_done = {
            "domain": bool(store.external_domain and store.external_domain.strip()),
            "enamad": bool(enamad_url),
            "payment": gw_configured,
            "shipping": shipping_configured,
            "first_product": products_count > 0,
            "google_search_console": bool(gsc),
            "google_analytics": bool(ga),
            "google_tag_manager": bool(gtm),
            "first_blog": articles_count > 0,
            "torob": bool(torob_url),
            "branding": bool(store.minimal_logo_id or store.full_logo_id),
            "subscription": sub_active,
            "start_selling": gw_configured and shipping_configured and products_count > 0 and sub_active,
        }

        tasks = [
            {
                "key": t["key"],
                "label": t["label"],
                "guide_path": t["guide_path"],
                "optional": t["optional"],
                "done": task_done.get(t["key"], False),
            }
            for t in SETUP_TASKS
        ]

        pending = SmartSetupRequest.objects.filter(store=store, status=SmartSetupRequest.STATUS_PENDING).first()

        # Domain change request - for persistent message until approved
        domain_req = DomainChangeRequest.objects.filter(
            store=store, status=DomainChangeRequest.STATUS_PENDING
        ).first()
        domain_change_pending = domain_req is not None
        domain_change_message = None
        if domain_change_pending and domain_req:
            domain_change_message = (
                f"درخواست تغییر دامنه به {domain_req.requested_domain} ثبت شده. "
                "لطفاً نام‌سرورهای دامنه خود را به موارد زیر تنظیم کنید: c.ns.arvancdn.ir و n.ns.arvancdn.ir. "
                "پس از تنظیم، درخواست شما توسط پشتیبانی بررسی و تایید خواهد شد."
            )

        return Response({
            "tasks": tasks,
            "smart_setup_completed": False,
            "smart_setup_pending": pending is not None,
            "smart_setup_request_id": str(pending.id) if pending else None,
            "smart_setup_current_stage": (pending.current_stage or "").strip() if pending else None,
            "store_id": str(store.id),
            "domain_change_pending": domain_change_pending,
            "domain_change_message": domain_change_message,
            "domain_change_request_id": str(domain_req.id) if domain_req else None,
        })

    @action(detail=False, methods=["get"], url_path="smart-setup-cost")
    def smart_setup_cost(self, request):
        """هزینه راه‌اندازی هوشمند (تنظیم از پنل ادمین)."""
        from store.models import SystemConfig
        cfg = SystemConfig.objects.filter(key="smart_setup_cost").first()
        amount = int(cfg.value) if cfg and cfg.value and str(cfg.value).strip().isdigit() else 0
        return Response({"cost_amount": amount})

    @action(detail=False, methods=["get"], url_path="initial-setup-service")
    def initial_setup_service(self, request):
        """
        اطلاعات سرویس سفارش راه‌اندازی اولیه وب‌سایت.
        شامل لیست آیتم‌های سرویس با توضیحات کامل و هزینه.
        """
        from store.models import SystemConfig
        from store.setup_utils import INITIAL_WEBSITE_SETUP_ITEMS

        cfg = SystemConfig.objects.filter(key="smart_setup_cost").first()
        cost = int(cfg.value) if cfg and cfg.value and str(cfg.value).strip().isdigit() else 0

        return Response({
            "slug": "initial_website_setup",
            "title": "سفارش راه‌اندازی اولیه وب‌سایت",
            "description": "ما تمام مراحل راه‌اندازی حرفه‌ای فروشگاه شما را انجام می‌دهیم؛ از تهیه SSL و اتصال دامنه تا نصب نماد و تنظیم درگاه پرداخت.",
            "items": INITIAL_WEBSITE_SETUP_ITEMS,
            "cost_amount": cost,
        })

    @action(detail=False, methods=["post"], url_path="create-smart-setup-request")
    def create_smart_setup_request(self, request):
        """
        ثبت درخواست راه‌اندازی هوشمند و ایجاد لینک پرداخت.
        هزینه از SystemConfig با کلید smart_setup_cost خوانده می‌شود.
        """
        store = getattr(request, "store", None)
        if not store:
            from account.models import StoreUser
            su = StoreUser.objects.filter(user=request.user, level__gte=1).select_related("store").first()
            store = su.store if su else None
        if not store:
            return Response({"detail": "فروشگاهی یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        from store.models import SystemConfig, SmartSetupRequest, SmartSetupPayment
        from payment.models import Payment, PaymentGateway
        from django.db import transaction

        cfg = SystemConfig.objects.filter(key="smart_setup_cost").first()
        amount = int(cfg.value) if cfg and cfg.value and str(cfg.value).strip().isdigit() else 0
        if amount <= 0:
            return Response(
                {"detail": "هزینه راه‌اندازی هوشمند تنظیم نشده است. با پشتیبانی تماس بگیرید."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # اگر قبلاً یک درخواست پرداخت‌شده یا در انتظار دارد
        pending = SmartSetupRequest.objects.filter(
            store=store, status=SmartSetupRequest.STATUS_PENDING
        ).first()
        if pending:
            pr = getattr(pending, "payment_record", None)
            if pr and pr.payment and pr.payment.status == "pending" and pr.payment.payment_link:
                return Response({
                    "payment_link": pr.payment.payment_link,
                    "smart_setup_request_id": str(pending.id),
                    "cost_amount": amount,
                })

        done = SmartSetupRequest.objects.filter(
            store=store, status=SmartSetupRequest.STATUS_DONE
        ).exists()
        if done:
            return Response(
                {"detail": "راه‌اندازی هوشمند این فروشگاه قبلاً انجام شده است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        super_store = store.super_store
        gateway = PaymentGateway.objects.filter(store=super_store).first()
        if not gateway:
            return Response(
                {"detail": "درگاه پرداخت پلتفرم تنظیم نشده است. با پشتیبانی تماس بگیرید."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        with transaction.atomic():
            ss_request = SmartSetupRequest.objects.create(
                store=store,
                status=SmartSetupRequest.STATUS_PENDING,
                cost_amount=amount,
            )
            from wallet.payment import PaymentService, PaymentRequest
            from django.conf import settings as django_settings

            payment_service = PaymentService.get_instance(gateway)
            payment_req = PaymentRequest(
                amount=amount,
                description=f"راه‌اندازی هوشمند فروشگاه {store.name}",
                mobile=store.owner.mobile if store.owner else "09123456789",
                email="info@tokan.app",
                callback_url=(
                    (getattr(django_settings, "API_URL_BASE", "") or "")
                    + "/wallet/verify_payment/"
                ),
            )
            authority, payment_link, success = payment_service.init_payment(payment_req)
            if not success:
                return Response(
                    {"detail": "مشکلی در اتصال به درگاه پرداخت وجود دارد."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            payment = Payment.objects.create(
                store=super_store,
                amount=amount,
                gateway=gateway,
                is_online_payment=True,
                status="pending",
                authority=authority,
                payment_link=payment_link or "",
            )
            SmartSetupPayment.objects.create(
                smart_setup_request=ss_request,
                payment=payment,
            )

        return Response({
            "payment_link": payment_link,
            "smart_setup_request_id": str(ss_request.id),
            "cost_amount": amount,
        })

    @action(detail=True, methods=["patch"], url_path="update-settings")
    def update_settings(self, request, pk=None):
        """Update store settings by key-value pairs. theme_slug is stored in Store model - use PATCH store instead."""
        store = self.get_object()
        data = request.data
        if not isinstance(data, dict):
            return Response(
                {"detail": "داده‌های تنظیمات باید به صورت شیء باشد."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from store.models import StoreSetting, SettingDefinition
        from store.setup_utils import extract_badge_link_from_html

        # کلیدهای نماد: اگر کاربر کد HTML وارد کرد، لینک را استخراج کن
        badge_keys = ("trust_enamad_url", "trust_samandehi_url")
        for key in badge_keys:
            if key in data and data[key] is not None:
                raw = str(data[key]).strip()
                if raw:
                    extracted = extract_badge_link_from_html(raw)
                    if extracted:
                        data[key] = extracted

        updated = []
        errors = []
        for key, value in data.items():
            if key == "theme_slug":
                errors.append("theme_slug: از PATCH فروشگاه با فیلد theme (شناسه تم) استفاده کنید")
                continue
            try:
                definition = SettingDefinition.objects.get(key=key)
                if not getattr(definition, "can_edit_by_store", True):
                    errors.append(f"{key}: قابل ویرایش توسط فروشگاه نیست")
                    continue
                setting, _ = StoreSetting.objects.get_or_create(
                    store=store,
                    definition=definition,
                    defaults={"value": str(value) if value is not None else definition.default_value or ""},
                )
                if value is not None:
                    setting.value = str(value)
                    setting.save()
                updated.append(key)
            except SettingDefinition.DoesNotExist:
                errors.append(f"{key}: کلید نامعتبر")
            except Exception as e:
                errors.append(f"{key}: {str(e)}")
        if errors:
            return Response({"errors": errors, "updated": updated}, status=status.HTTP_207_MULTI_STATUS)
        return Response({"updated": updated})

    def _resolve_store_for_domain_request(self, request):
        """Resolve store from request - either request.store (storefront) or user's store via StoreUser."""
        store = getattr(request, "store", None)
        if not store:
            from account.models import StoreUser
            su = StoreUser.objects.filter(
                user=request.user, level__gte=1
            ).select_related("store").order_by("-level").first()
            store = su.store if su else None
        return store

    @action(detail=False, methods=["post"], url_path="create-domain-request")
    def create_domain_request(self, request):
        """
        ثبت درخواست تغییر دامنه. کاربر فقط وقتی می‌تواند درخواست دهد که دامنه اختصاصی نداشته باشد.
        نمی‌تواند همزمان دو درخواست pending داشته باشد.
        """
        store = self._resolve_store_for_domain_request(request)
        if not store:
            return Response({"detail": "فروشگاهی یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        if store.has_custom_domain:
            return Response(
                {"detail": "این فروشگاه قبلاً دامنه اختصاصی خود را ثبت کرده است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        requested_domain = (request.data.get("requested_domain") or "").strip()
        if not requested_domain:
            return Response(
                {"detail": "دامنه درخواستی را وارد کنید."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Remove protocol if user entered it
        for prefix in ("https://", "http://", "www."):
            if requested_domain.lower().startswith(prefix):
                requested_domain = requested_domain[len(prefix):].strip()
        if requested_domain.startswith("www."):
            requested_domain = requested_domain[4:]

        if not re.match(r"^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", requested_domain):
            return Response(
                {"detail": "فرمت دامنه معتبر نیست."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cannot have two pending requests
        existing = DomainChangeRequest.objects.filter(
            store=store, status=DomainChangeRequest.STATUS_PENDING
        ).exists()
        if existing:
            return Response(
                {"detail": "شما قبلاً یک درخواست در حال بررسی دارید. لطفاً صبر کنید یا آن را لغو کنید."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        domain_req = DomainChangeRequest.objects.create(
            store=store,
            requested_domain=requested_domain,
            status=DomainChangeRequest.STATUS_PENDING,
        )

        message = (
            f"درخواست تغییر دامنه به {requested_domain} با موفقیت ثبت شد. "
            "لطفاً نام‌سرورهای (NS) دامنه خود را به موارد زیر تنظیم کنید:\n"
            "c.ns.arvancdn.ir\nn.ns.arvancdn.ir\n\n"
            "پس از تنظیم، درخواست شما توسط پشتیبانی بررسی و تایید خواهد شد."
        )
        return Response({
            "id": str(domain_req.id),
            "requested_domain": domain_req.requested_domain,
            "status": domain_req.status,
            "message": message,
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="cancel-domain-request")
    def cancel_domain_request(self, request):
        """لغو درخواست تغییر دامنه در حال بررسی."""
        store = self._resolve_store_for_domain_request(request)
        if not store:
            return Response({"detail": "فروشگاهی یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        updated = DomainChangeRequest.objects.filter(
            store=store, status=DomainChangeRequest.STATUS_PENDING
        ).update(status=DomainChangeRequest.STATUS_CANCELLED)

        if updated == 0:
            return Response(
                {"detail": "درخواست در حال بررسی یافت نشد."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({"detail": "درخواست با موفقیت لغو شد."})

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        """Activate a store (only for super store owners)"""
        store = self.get_object()
        current_store = getattr(request, "store", None)

        if not current_store or not current_store._is_super_store:
            return Response(
                {"detail": "Only super store owners can activate stores."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if store.super_store != current_store:
            return Response(
                {"detail": "Can only activate stores under your super store."},
                status=status.HTTP_403_FORBIDDEN,
            )

        store.is_active = True
        store.is_accepted = True
        store.save()
        return Response({"status": "store activated"})
    
    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "store_name": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Store Name",
                ),
            },
            required=["store_name"],
        ),
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "status": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description="status",
                    ),
                    "detail": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description="detail link",
                    ),
                },
            )
        },
    )
    @action(detail=False, methods=['post'])
    def check_store_name(self, request):
        store_name = request.data.get("store_name")
        
        if not is_valid_subdomain(store_name):
            return Response(
                {
                    "detail": "آیدی فروشگاه باید ترکیبی از حروف انگلیسی و اعداد و حداقل 3 کارکتر باشد.",
                    "status": "notusable"
                 },
            )
        if Store.objects.filter(name=store_name).exists():
            return Response(
                {
                    "detail": "این آیدی قبلا استفاده شده است.",
                    "status": "notusable"
                }
            )
        return Response({
            "detail": "آیدی قابل استفاده است.",
            "status": "usable"
        })