from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from core.permissions import IsStoreCustomer
from .models import SystemAnnouncement, SystemAnnouncementRead
from .serializers import SystemAnnouncementSerializer


class SystemAnnouncementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API اعلانات سیستمی برای داشبورد فروشگاه.
    فقط خواندن؛ خوانده‌شدن از طریق action ها.
    """
    serializer_class = SystemAnnouncementSerializer
    permission_classes = [IsStoreCustomer]
    pagination_class = None  # Return full list for dropdown/dashboard

    def get_queryset(self):
        store = getattr(self.request, "store", None)
        store_user = getattr(self.request, "store_user", None)
        if not store or not store_user:
            return SystemAnnouncement.objects.none()

        return (
            SystemAnnouncement.objects
            .filter(is_active=True)
            .filter(Q(store__isnull=True) | Q(store=store))
            .order_by("-created_at")
        )

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        """علامت‌گذاری یک اعلان به عنوان خوانده شده"""
        announcement = self.get_object()
        store_user = request.store_user
        SystemAnnouncementRead.objects.get_or_create(
            announcement=announcement,
            store_user=store_user,
        )
        return Response({"ok": True})

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        """علامت‌گذاری همه اعلانات به عنوان خوانده شده"""
        store_user = request.store_user
        queryset = self.get_queryset()
        for ann in queryset:
            SystemAnnouncementRead.objects.get_or_create(
                announcement=ann,
                store_user=store_user,
            )
        return Response({"ok": True})

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        """تعداد اعلانات خوانده نشده"""
        store_user = request.store_user
        queryset = self.get_queryset()
        read_ids = set(
            SystemAnnouncementRead.objects
            .filter(store_user=store_user, announcement__in=queryset)
            .values_list("announcement_id", flat=True)
        )
        count = queryset.exclude(id__in=read_ids).count()
        return Response({"count": count})
