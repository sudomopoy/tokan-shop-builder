from django.urls import path, include
from rest_framework.routers import DefaultRouter
from store.views import StoresViewSet, StoreViewSet, StoreCategoryViewSet

router = DefaultRouter()
router.register(r"stores", StoresViewSet, basename="stores")
router.register(r"store", StoreViewSet, basename="store")
router.register(r"categories", StoreCategoryViewSet, basename="store-category")

urlpatterns = [
    path(
        "stores/<path:domain>/",
        StoresViewSet.as_view({"get": "retrieve"}),
        name="store-detail",
    ),
] + router.urls
