from rest_framework.routers import DefaultRouter
from slider.views import SliderViewSet, SlideViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r"sliders", SliderViewSet, basename="slider")
router.register(r"slides", SlideViewSet, basename="slide")

urlpatterns = [path("", include(router.urls))]
