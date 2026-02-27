"""
API برای پنل مدیریت کاربر - وقتی store context نداریم (panel.tokan.app)
"""
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from account.models import User
from account.serializers import AccountInfoSerializer
from store.models import Store
from account.models import StoreUser


class PanelUserInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        اطلاعات کاربر برای پنل مدیریت: کاربر، کیف پول، لینک افیلیت، لیست فروشگاه‌ها.
        """
        user = User.objects.get(pk=request.user.pk)
        account_data = AccountInfoSerializer(user, context={"request": request}).data
        # لینک افیلیت
        from affiliate.views import AffiliateViewSet
        vs = AffiliateViewSet()
        vs.request = request
        link_resp = vs.my_link(request)
        affiliate_link = link_resp.data
        # لیست فروشگاه‌های قابل دسترسی
        owned_ids = list(Store.objects.filter(owner=request.user).values_list("pk", flat=True))
        admin_ids = list(
            StoreUser.objects.filter(user=request.user, level__gte=1)
            .values_list("store_id", flat=True)
            .distinct()
        )
        store_ids = list(set(owned_ids) | set(admin_ids))
        stores = Store.objects.filter(pk__in=store_ids).order_by("name")
        store_list = []
        for s in stores:
            store_list.append({
                "id": str(s.id),
                "name": s.name,
                "title": s.title,
                "internal_domain": s.internal_domain,
                "external_domain": s.external_domain,
                "dashboard_url": f"https://{s.internal_domain}/dashboard" if s.internal_domain else None,
                "is_owner": s.owner_id == request.user.pk,
            })
        return Response({
            "user": account_data,
            "affiliate_link": affiliate_link,
            "stores": store_list,
        })
