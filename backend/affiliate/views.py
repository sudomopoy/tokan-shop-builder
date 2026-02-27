from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings as django_settings

from .models import AffiliateInvite, AffiliateEarning, AffiliateConfig
from .serializers import AffiliateInviteSerializer, AffiliateEarningSerializer, AffiliateConfigSerializer
class AffiliateViewSet(viewsets.GenericViewSet):
    """افیلیت - در داشبورد فروشگاه و پنل مدیریت کاربر کار می‌کند"""
    permission_classes = [IsAuthenticated]

    def get_base_url(self):
        """دامنه اصلی برای لینک دعوت"""
        base = getattr(django_settings, "WEBSITE_URL_BASE", "https://tokan.app")
        return base.rstrip("/")

    @action(detail=False, methods=["get"])
    def my_link(self, request):
        """لینک و کد دعوت کاربر"""
        user = request.user
        if not user.referral_code:
            user.save()  # generate referral_code
        base = self.get_base_url()
        link = f"{base}/setup?ref={user.referral_code}"
        return Response({
            "referral_code": user.referral_code,
            "referral_link": link,
        })

    @action(detail=False, methods=["get"])
    def invites(self, request):
        """لیست دعوت‌شده‌ها"""
        qs = AffiliateInvite.objects.filter(inviter=request.user).select_related("invitee").order_by("-created_at")
        serializer = AffiliateInviteSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def earnings(self, request):
        """لیست کمیسیون‌ها"""
        invites = AffiliateInvite.objects.filter(inviter=request.user).values_list("id", flat=True)
        qs = AffiliateEarning.objects.filter(invite_id__in=invites).select_related(
            "invite__invitee", "order"
        ).order_by("-created_at")
        serializer = AffiliateEarningSerializer(qs, many=True)
        total_completed = sum(
            float(e.commission_amount) for e in qs if e.status == "completed"
        )
        total_pending = sum(
            float(e.commission_amount) for e in qs if e.status == "pending"
        )
        return Response({
            "earnings": serializer.data,
            "total_completed": total_completed,
            "total_pending": total_pending,
        })

    @action(detail=False, methods=["get"])
    def config(self, request):
        """تنظیمات پیش‌فرض (فقط خواندنی)"""
        config = AffiliateConfig.get_config()
        return Response(AffiliateConfigSerializer(config).data)
