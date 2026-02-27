from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import  PaymentGatewayViewSet

router = DefaultRouter()
router.register(r'gateways', PaymentGatewayViewSet, basename='gateway')

urlpatterns = [
    path('', include(router.urls)),
]
