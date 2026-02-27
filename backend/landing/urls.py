from django.urls import path
from .views import SupportRequestView

urlpatterns = [
    path("support-request/", SupportRequestView.as_view(), name="support-request"),
]
