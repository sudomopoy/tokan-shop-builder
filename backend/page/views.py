from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.core.cache import cache
from django.conf import settings
from django.db import transaction

from account.models import StoreUser
from core.i18n import get_deploy_locale, localize_value
from core.permissions import IsStoreOwnerOnly

from .models import Page, Widget, WidgetType, Theme
from .path_utils import match_path
from .widget_builder_catalog import get_default_payload, get_visual_schema, get_widget_icon

THEME_SLUG_CACHE_TTL = getattr(
    settings, "THEME_SLUG_CACHE_TTL", 3 if settings.DEBUG else 60 * 10
)  # 3 sec in DEBUG, 10 min in production


def get_store_theme_slug(store):
    """Get theme slug from Store.theme relation with cache."""
    cache_key = f"store:{store.id}:theme_slug"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    value = "default"
    if getattr(store, "theme_id", None):
        theme = getattr(store, "theme", None)
        if theme:
            value = (theme.slug or "default").strip() or "default"
    cache.set(cache_key, value, THEME_SLUG_CACHE_TTL)
    return value


def invalidate_store_theme_slug_cache(store_id):
    """Invalidate theme_slug cache when store changes."""
    cache.delete(f"store:{store_id}:theme_slug")


from .serializers import (
    PageSerializer,
    PageConfigSerializer,
    WidgetSerializer,
    WidgetTypeSerializer,
    ThemeSerializer,
)


class PageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing pages
    Provides CRUD operations and page configuration retrieval
    """
    queryset = Page.objects.all()
    serializer_class = PageSerializer

    def get_permissions(self):
        if self.action == "get_by_path":
            return [AllowAny()]
        return [IsStoreOwnerOnly()]  # صفحه‌ساز فقط مالک

    def get_queryset(self):
        """
        Filter pages by store if store is available in request
        """
        queryset = super().get_queryset()
        
        # Filter by store: query param, request.store (middleware), or user's first StoreUser
        store_id = self.request.query_params.get('store')
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        else:
            store = getattr(self.request, 'store', None)
            if not store:
                su = StoreUser.objects.filter(user=self.request.user, level__gte=1).select_related('store').order_by('-level').first()
                store = su.store if su else None
            if store:
                queryset = queryset.filter(store=store)
        
        # NOTE: Do not filter by is_active here.
        # Management endpoints (dashboard) must be able to list/edit inactive pages too.
        # The storefront endpoint `by-path` already enforces `is_active=True`.
        return queryset.prefetch_related('widgets__widget_type')
    
    @action(detail=False, methods=['get'], url_path='by-path')
    def get_by_path(self, request):
        """
        Retrieve page configuration by path (AllowAny - no auth needed).

        Public storefront endpoint - use this for displaying store pages.

        GET /page/pages/by-path/?path=/
        GET /page/pages/by-path/?path=/about
        GET /page/pages/by-path/?path=/product/123/my-slug  (dynamic path)
        GET /page/pages/by-path/?path=/&store=1  (optional: explicit store id for dev/testing)

        NOTE: Do NOT use GET /page/pages/{slug}/ - that endpoint requires authentication.
        """
        path = request.query_params.get('path', '/')
        path = '/' + path.strip('/') if path != '/' else path
        store_id = request.query_params.get('store')

        base_query = Q(is_active=True)
        if store_id:
            base_query &= Q(store_id=store_id)
        elif hasattr(request.user, 'store') and request.user.store:
            base_query &= Q(store=request.user.store)
        elif getattr(request, 'store', None):
            base_query &= Q(store=request.store)

        queryset = Page.objects.prefetch_related('widgets__widget_type').filter(base_query)
        path_params = {}

        # 1. Try exact path match first (path without : is static)
        page = queryset.filter(path=path).first()

        if not page:
            # 2. Try dynamic path matching (path containing : is a pattern)
            pattern_pages = queryset.filter(path__contains=':')
            for p in pattern_pages:
                params = match_path(p.path, path)
                if params is not None:
                    page = p
                    path_params = params
                    break

        if not page:
            from rest_framework.exceptions import NotFound
            raise NotFound('Page not found')

        store = getattr(request, 'store', None) or page.store

        # اگر اشتراک بیش از ۱۰ روز منقضی شده، صفحه مخصوص "اشتراک منقضی شده" برگردان
        if store and getattr(store, 'is_subscription_expired_over_10_days', False):
            data = {
                'path': path,
                'theme': get_store_theme_slug(store) if store else 'default',
                'subscription_expired': True,
                'subscription_expired_over_10_days': True,
                'store_title': getattr(store, 'title', '') or store.name,
                'widgets': [],
                'layout': None,
            }
            return Response(data)

        serializer = PageSerializer(page, context={
            'path_params': path_params,
            'request_path': path,
        })
        data = dict(serializer.data)

        # Add theme_slug from store model (cached) for storefront
        if store:
            data['theme'] = get_store_theme_slug(store)
        else:
            data['theme'] = 'default'

        # Add subscription info for header (days remaining, etc.)
        if store:
            data['subscription_days_remaining'] = getattr(store, 'subscription_days_remaining', None)
            data['subscription_expires_at'] = (
                store.subscription_expires_at.isoformat() if store.subscription_expires_at else None
            )

        return Response(data)
    
    @action(detail=True, methods=['get'], url_path='config')
    def get_config(self, request, pk=None):
        """
        Get page configuration in PageConfig format
        GET /api/pages/{id}/config/
        """
        page = self.get_object()
        serializer = PageSerializer(page)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='all-configs')
    def all_configs(self, request):
        """
        Get all page configurations as array
        GET /api/pages/all-configs/
        GET /api/pages/all-configs/?store=1
        
        Returns: [PageConfig, PageConfig, ...]
        """
        pages = self.get_queryset()
        serializer = PageSerializer(pages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='setup-defaults')
    def setup_defaults(self, request):
        """
        Create default store pages with suggested widgets.
        Creates default WidgetTypes if missing, then creates essential pages:
        home, search, product detail, categories, basket, checkout, login, profile,
        orders, order detail, blog, blog detail.
        POST /api/page/pages/setup-defaults/
        Store is resolved from: request.store (middleware/domain), ?store= param, or user's first StoreUser.
        """
        is_en = get_deploy_locale() == "en"
        store = getattr(request, 'store', None)
        if not store:
            data = getattr(request, 'data', None)
            store_id = request.query_params.get('store') or (data.get('store') if isinstance(data, dict) else None)
            if store_id:
                from store.models import Store
                try:
                    store = Store.objects.get(pk=store_id)
                except (Store.DoesNotExist, ValueError):
                    store = None
        if not store:
            store_user = (
                StoreUser.objects.filter(user=request.user, level__gte=1)
                .select_related('store')
                .order_by('-level', '-register_at')
                .first()
            )
            store = store_user.store if store_user else None
        if not store:
            return Response(
                {'detail': 'No store found for this user' if is_en else 'فروشگاهی برای کاربر یافت نشد'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not StoreUser.objects.filter(store=store, user=request.user, level__gte=1).exists():
            return Response(
                {'detail': 'You do not have admin access to this store' if is_en else 'شما دسترسی مدیریت به این فروشگاه را ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )

        result = {'created': 0, 'skipped': 0, 'errors': [], 'widget_types_created': 0}
        deploy_locale = get_deploy_locale()

        def t(fa: str, en: str) -> str:
            return en if deploy_locale == "en" else fa

        # Default widget types: (name, is_layout)
        default_widget_types = [
            ('layout', True),
            ('slider', False),
            ('menu', False),
            ('product.listview', False),
            ('product.detail', False),
            ('product.search', False),
            ('category.listview', False),
            ('category.search', False),
            ('basket', False),
            ('checkout', False),
            ('login', False),
            ('profile', False),
            ('profile.my_videos', False),
            ('profile.my_downloads', False),
            ('order.listview', False),
            ('order.detail', False),
            ('blog.listview', False),
            ('blog.detail', False),
            ('blog.search', False),
            ('static.404', False),
            ('static.500', False),
            ('static.403', False),
            ('reservation', False),
            ('content.text', False),
            ('content.image', False),
            ('form.builder', False),
        ]

        with transaction.atomic():
            # Ensure widget types exist
            for wt_name, is_layout in default_widget_types:
                default_payload = get_default_payload(wt_name)
                defaults = {
                    'is_layout': is_layout,
                    'is_active': True,
                    'icon': get_widget_icon(wt_name),
                    'visual_schema': get_visual_schema(wt_name),
                    'default_widget_config': default_payload.get('widget_config', {}),
                    'default_components_config': default_payload.get('components_config', {}),
                    'default_extra_request_params': default_payload.get('extra_request_params', {}),
                }
                widget_type, created = WidgetType.objects.get_or_create(
                    name=wt_name,
                    defaults=defaults,
                )
                if created:
                    result['widget_types_created'] += 1
                else:
                    update_fields = []
                    if widget_type.is_layout != is_layout:
                        widget_type.is_layout = is_layout
                        update_fields.append('is_layout')
                    if not widget_type.icon:
                        widget_type.icon = defaults['icon']
                        update_fields.append('icon')
                    if not widget_type.visual_schema:
                        widget_type.visual_schema = defaults['visual_schema']
                        update_fields.append('visual_schema')
                    if not widget_type.default_widget_config and defaults['default_widget_config']:
                        widget_type.default_widget_config = defaults['default_widget_config']
                        update_fields.append('default_widget_config')
                    if not widget_type.default_components_config and defaults['default_components_config']:
                        widget_type.default_components_config = defaults['default_components_config']
                        update_fields.append('default_components_config')
                    if not widget_type.default_extra_request_params and defaults['default_extra_request_params']:
                        widget_type.default_extra_request_params = defaults['default_extra_request_params']
                        update_fields.append('default_extra_request_params')
                    if update_fields:
                        widget_type.save(update_fields=update_fields)

            wt_by_name = {wt.name: wt for wt in WidgetType.objects.filter(name__in=[n for n, _ in default_widget_types])}
            layout_type = wt_by_name.get('layout')

            store_category_slug = (getattr(store.store_category, 'slug', None) or '') if getattr(store, 'store_category', None) else ''
            is_reservation = store_category_slug == 'reservation'
            is_streaming = store_category_slug == 'streaming'
            is_download = store_category_slug == 'download'

            if is_reservation:
                # فروشگاه رزرواسیون: بدون محصول، فقط ویجت‌های رزرو
                default_pages = [
                    ('/', t('صفحه اصلی', 'Home'), ['slider', 'reservation']),
                    ('/reservation', t('رزرو آنلاین', 'Online Reservation'), ['reservation']),
                    ('/login', t('ورود / ثبت‌نام', 'Login / Signup'), ['login']),
                    ('/profile', t('حساب کاربری', 'Profile'), ['profile']),
                    ('/404', t('صفحه یافت نشد', 'Not Found'), ['static.404']),
                    ('/500', t('خطای سرور', 'Server Error'), ['static.500']),
                    ('/403', t('عدم دسترسی', 'Forbidden'), ['static.403']),
                ]
            else:
                # فروشگاه محصولی (فیزیکی، دیجیتال، دانلودی، استریمینگ)
                base_pages = [
                    ('/', t('صفحه اصلی', 'Home'), ['slider', 'category.listview', 'product.listview']),
                    ('/search', t('جستجوی محصولات', 'Product Search'), ['product.search']),
                    ('/product/:id:number/:slug?:string', t('جزئیات محصول', 'Product Detail'), ['product.detail']),
                    ('/categories', t('دسته‌بندی‌ها', 'Categories'), ['category.search']),
                    ('/basket', t('سبد خرید', 'Basket'), ['basket']),
                    ('/checkout', t('تکمیل خرید', 'Checkout'), ['checkout']),
                    ('/login', t('ورود / ثبت‌نام', 'Login / Signup'), ['login']),
                    ('/profile', t('حساب کاربری', 'Profile'), ['profile']),
                    ('/orders', t('سفارشات من', 'My Orders'), ['order.listview']),
                    ('/order/:id:number', t('جزئیات سفارش', 'Order Detail'), ['order.detail']),
                    ('/blog', t('بلاگ', 'Blog'), ['blog.listview']),
                    ('/blog/:slug', t('مقاله بلاگ', 'Blog Article'), ['blog.detail']),
                    ('/404', t('صفحه یافت نشد', 'Not Found'), ['static.404']),
                    ('/500', t('خطای سرور', 'Server Error'), ['static.500']),
                    ('/403', t('عدم دسترسی', 'Forbidden'), ['static.403']),
                ]
                # صفحات مخصوص نوع فروشگاه دیجیتال (استریم، دانلود، دیجیتال عمومی)
                extra_after_profile = []
                if is_streaming:
                    extra_after_profile = [('/my-videos', t('ویدیوهای خریداری‌شده', 'Purchased Videos'), ['profile.my_videos'])]
                elif is_download:
                    extra_after_profile = [('/my-downloads', t('دانلودهای من', 'My Downloads'), ['profile.my_downloads'])]
                elif store_category_slug == 'digital':
                    extra_after_profile = [
                        ('/my-videos', t('ویدیوهای خریداری‌شده', 'Purchased Videos'), ['profile.my_videos']),
                        ('/my-downloads', t('دانلودهای من', 'My Downloads'), ['profile.my_downloads']),
                    ]
                idx = next(i for i, p in enumerate(base_pages) if p[0] == '/profile')
                for i, extra in enumerate(extra_after_profile):
                    base_pages.insert(idx + 1 + i, extra)
                default_pages = base_pages

            widget_configs = {
                'category.listview': {'module': 'STORE', 'root_only': True},
                'category.search': {'module': 'STORE'},
                'blog.listview': {'module': 'blog'},
            }

            for path, title, content_names in default_pages:
                if Page.objects.filter(store=store, path=path).exists():
                    result['skipped'] += 1
                    continue

                try:
                    page = Page.objects.create(
                        store=store,
                        path=path,
                        title=title,
                        is_active=True,
                    )
                    result['created'] += 1

                    # Layout widget
                    if layout_type:
                        Widget.objects.create(
                            page=page,
                            widget_type=layout_type,
                            index=0,
                            is_active=True,
                            widget_config={'header': True, 'footer': True},
                        )

                    # Content widgets
                    for idx, name in enumerate(content_names, start=1):
                        wt = wt_by_name.get(name)
                        if not wt or wt.is_layout:
                            continue
                        config = widget_configs.get(name, {})
                        Widget.objects.create(
                            page=page,
                            widget_type=wt,
                            index=idx,
                            is_active=True,
                            widget_config=config,
                        )
                except Exception as e:
                    result['errors'].append(f'{path}: {str(e)}')

        return Response(result, status=status.HTTP_200_OK)


class WidgetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing widgets
    """
    queryset = Widget.objects.all()
    serializer_class = WidgetSerializer
    
    def get_queryset(self):
        """
        Filter widgets by page if provided
        """
        queryset = super().get_queryset().select_related('widget_type', 'page')
        
        page_id = self.request.query_params.get('page_id')
        if page_id:
            queryset = queryset.filter(page_id=page_id)
        
        return queryset.filter(is_active=True).order_by('index')


class WidgetTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for widget types (read-only). Used in dropdowns - no pagination.
    """
    queryset = WidgetType.objects.all()
    serializer_class = WidgetTypeSerializer
    pagination_class = None

    def get_queryset(self):
        """
        Filter widget types by theme if provided
        """
        queryset = super().get_queryset().select_related('theme').prefetch_related('styles__preview_image')

        theme_id = self.request.query_params.get('theme')
        if theme_id:
            queryset = queryset.filter(Q(theme_id=theme_id) | Q(theme__isnull=True))

        return queryset.filter(is_active=True)

    def _resolve_store(self):
        store = getattr(self.request, 'store', None)
        if store:
            return store
        store_id = self.request.query_params.get('store')
        if store_id:
            from store.models import Store
            try:
                return Store.objects.get(pk=store_id)
            except (Store.DoesNotExist, ValueError):
                return None
        user = getattr(self.request, 'user', None)
        if not user or not user.is_authenticated:
            return None
        su = (
            StoreUser.objects.filter(user=user, level__gte=1)
            .select_related('store')
            .order_by('-level', '-register_at')
            .first()
        )
        return su.store if su else None

    @action(detail=False, methods=['get'], url_path='builder-options')
    def builder_options(self, request):
        """
        Return entity options used by visual widget builder.
        GET /page/widget-types/builder-options/?sources=slider,menu,page,category,product,article
        """
        store = self._resolve_store()
        if not store:
            return Response({'sources': {}}, status=status.HTTP_200_OK)

        sources_raw = request.query_params.get('sources')
        if sources_raw:
            requested_sources = {s.strip() for s in sources_raw.split(',') if s.strip()}
        else:
            requested_sources = {'slider', 'menu', 'page', 'category', 'product', 'article'}

        result = {}

        if 'slider' in requested_sources:
            from slider.models import Slider
            result['slider'] = [
                {'value': str(item.id), 'label': localize_value(item.title) or f"Slider {item.id}"}
                for item in Slider.objects.filter(store=store).order_by('-updated_at')[:300]
            ]

        if 'menu' in requested_sources:
            from menu.models import Menu
            result['menu'] = [
                {'value': str(item.id), 'label': localize_value(item.title) or item.key or f"Menu {item.id}"}
                for item in Menu.objects.filter(store=store).order_by('-updated_at')[:300]
            ]

        if 'page' in requested_sources:
            result['page'] = [
                {'value': str(item.id), 'label': localize_value(item.title) or item.path, 'path': item.path}
                for item in Page.objects.filter(store=store).order_by('path')[:500]
            ]

        if 'category' in requested_sources:
            from category.models import Category
            result['category'] = [
                {'value': str(item.id), 'label': localize_value(item.name), 'module': item.module}
                for item in Category.objects.filter(store=store).order_by('name')[:500]
            ]

        if 'product' in requested_sources:
            from product.models import Product
            result['product'] = [
                {'value': str(item.id), 'label': localize_value(item.title)}
                for item in Product.objects.filter(store=store).order_by('-updated_at')[:500]
            ]

        if 'article' in requested_sources:
            from article.models import Article
            result['article'] = [
                {'value': str(item.id), 'label': localize_value(item.title), 'slug': item.slug}
                for item in Article.objects.filter(store=store).order_by('-updated_at')[:500]
            ]

        return Response({'sources': result}, status=status.HTTP_200_OK)


class ThemeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for theme catalog - لیست تم‌های قابل انتخاب برای فروشگاه
    """
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    lookup_field = 'slug'
    lookup_url_kwarg = 'slug'

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
            .select_related('thumbnail', 'category')
            .prefetch_related('tags', 'gallery_images__media')
        )
        queryset = queryset.filter(is_active=True, is_public=True)
        if self.request.query_params.get("free_only") == "true":
            queryset = queryset.filter(is_paid=False)
        return queryset
