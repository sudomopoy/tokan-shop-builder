from rest_framework import viewsets
from .models import PaymentGateway
from .serializers import PaymentGatewaySerializer, PaymentGatewayUpdateSerializer
from core.viewset import BaseStoreViewSet


class PaymentGatewayViewSet(BaseStoreViewSet):
    queryset = PaymentGateway.objects.all().select_related("gateway_type")
    serializer_class = PaymentGatewaySerializer
    pagination_class = None

    def get_serializer_class(self):
        if self.action in ("partial_update", "update"):
            return PaymentGatewayUpdateSerializer
        return PaymentGatewaySerializer