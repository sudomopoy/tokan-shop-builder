"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.contrib.sitemaps.views import sitemap
from .swagger import schema_view
from .health import health_check, live_check
from .sitemap import sitemaps
from django.conf import settings
from django.conf.urls.static import static
from jwt_auth.views import TokenObtainPairView, TokenRefreshView
from django.shortcuts import redirect
from account.views import StoreLoginView

admin.site.site_title = "tokan.app admin"
admin.site.site_header = "tokan.app admin"

urlpatterns = [
    path("account/", include("account.urls")),
    path("guide/", include("guide.urls")),
    path("announcement/", include("notification.urls")),
    path("article/", include("article.urls")),
    path("category/", include("category.urls")),
    path("tag/", include("tag.urls")),
    path("media/", include("media.urls")),
    path("product/", include("product.urls")),
    path("review/", include("review.urls")),
    path("wallet/", include("wallet.urls")),
    path("payment/", include("payment.urls")),
    path("order/", include("order.urls")),
    path("basket/", include("basket.urls")),
    path("meta/", include("meta.urls")),
    path("slider/", include("slider.urls")),
    path("page/", include("page.urls")),
    path("menu/", include("menu.urls")),
    path("store/", include("store.urls")),
    path("subscription/", include("subscription.urls")),
    path("reservation/", include("reservation.urls")),
    path("affiliate/", include("affiliate.urls")),
    path("landing/", include("landing.urls")),
    path("link/", include("link.urls")),
    path("stream/", include("stream.urls")),
    re_path(
        r"^swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    path(
        "swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-redoc"
    ),
    path("i18n/", include("django.conf.urls.i18n")),
    path("admin/", admin.site.urls),
    path(
        "sitemap.xml",
        sitemap,
        {"sitemaps": sitemaps},
        name="django.contrib.sitemaps.views.sitemap",
    ),
    path("health/", health_check, name="health_check"),
    path("health/live/", live_check, name="health_live"),
    path("auth/", include("drfpasswordless.urls")),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/obtain/", TokenObtainPairView.as_view(), name="token_obtain"),
    path("", lambda request: redirect("/admin/")),
]

from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
