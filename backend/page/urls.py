from django.urls import path, include
from rest_framework.routers import DefaultRouter
from page.views import PageViewSet, WidgetViewSet, WidgetTypeViewSet, ThemeViewSet

router = DefaultRouter()
router.register(r"pages", PageViewSet, basename="page")
router.register(r"widgets", WidgetViewSet, basename="widget")
router.register(r"widget-types", WidgetTypeViewSet, basename="widget-type")
router.register(r"themes", ThemeViewSet, basename="theme")

urlpatterns = router.urls + [
    path(
        "pages/<path:path>/",
        PageViewSet.as_view({"get": "retrieve"}),
        name="page-detail",
    ),
] 
