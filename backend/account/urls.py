from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccountViewSet, AddressViewSet, BankAccountViewSet, StoreUserViewSet, CustomerGroupViewSet
from .views_panel import PanelUserInfoView

router = DefaultRouter()
router.register(r"account", AccountViewSet, basename="account")
router.register(r"address", AddressViewSet, basename="address")
router.register(r"bank-accounts", BankAccountViewSet, basename="bank-accounts")
router.register(r"store-users", StoreUserViewSet, basename="store-users")
router.register(r"customer-groups", CustomerGroupViewSet, basename="customer-groups")

urlpatterns = [
    path("panel-info/", PanelUserInfoView.as_view(), name="panel-user-info"),
    path("", include(router.urls)),
]
