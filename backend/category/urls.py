from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, category_icon_view

router = DefaultRouter()
router.register(r'', CategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('icon/<str:icon_name>/', category_icon_view, name='category-icon'),
]
