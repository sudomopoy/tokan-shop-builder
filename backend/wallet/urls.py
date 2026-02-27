from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WalletViewSet, TransactionViewSet, WithdrawRequestViewSet

router = DefaultRouter()
router.register(r'', WalletViewSet, basename='wallet')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'withdraw-requests', WithdrawRequestViewSet, basename='withdraw-request')

urlpatterns = [
    path('', include(router.urls)),
]
