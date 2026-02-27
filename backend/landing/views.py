from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import SupportRequest
from .serializers import SupportRequestSerializer


class SupportRequestThrottle(AnonRateThrottle):
    """محدودیت ۵ درخواست در ۱۰ دقیقه برای هر IP"""
    scope = "support_request"


class SupportRequestView(APIView):
    """
    API عمومی برای ثبت درخواست پشتیبانی یا مشاوره از لندینگ.
    بدون نیاز به احراز هویت.
    """
    permission_classes = [AllowAny]
    throttle_classes = [SupportRequestThrottle]

    def post(self, request):
        serializer = SupportRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        obj = serializer.save()
        return Response(
            {"id": str(obj.id), "detail": "درخواست با موفقیت ثبت شد."},
            status=status.HTTP_201_CREATED,
        )
