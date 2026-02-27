from rest_framework.routers import DefaultRouter
from meta.views import ProvincesViewSet, CitiesViewSet
from django.urls import path, include

router = DefaultRouter()

router.register(r"province", ProvincesViewSet)
router.register(r"city", CitiesViewSet)


urlpatterns = [path("", include(router.urls))]
