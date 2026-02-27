from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action

from core.permissions import IsStoreCustomer
from .models import PageGuide
from .serializers import PageGuideSerializer, ChatRequestSerializer
from .services.chat_service import chat
from .services.usage_service import check_can_ask, increment_usage


class GuideViewSet(viewsets.GenericViewSet):
    """
    API راهنمای صفحات داشبورد.
    """
    permission_classes = [IsStoreCustomer]

    @action(
        detail=False,
        methods=["get"],
        url_path="guide-by-path",
        permission_classes=[IsAuthenticated],
    )
    def guide_by_path(self, request, *args, **kwargs):
        """
        GET /guide/guide-by-path/?path=/dashboard/pages
        بر اساس path صفحه، راهنمای متناظر را برمی‌گرداند.
        طولانی‌ترین path تطابق‌دار انتخاب می‌شود.
        """
        path = (request.query_params.get("path") or "").strip()
        if not path or not path.startswith("/"):
            path = "/"
        path_norm = path.rstrip("/") or "/"
        best = None
        for g in PageGuide.objects.all():
            p = (g.path or "").rstrip("/") or "/"
            if path_norm == p or path_norm.startswith(p + "/"):
                if best is None or len(p) >= len((best.path or "").rstrip("/")):
                    best = g
        if not best:
            return Response(None)
        return Response(PageGuideSerializer(best).data)

    @action(
        detail=False,
        methods=["post"],
        url_path="chat",
        permission_classes=[IsAuthenticated],
    )
    def chat_action(self, request, *args, **kwargs):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        store = getattr(request, "store", None)
        if not store:
            return Response(
                {"response": "فروشگاه مشخص نیست.", "success": False},
                status=400,
            )
        can_ask, limit_msg = check_can_ask(store)
        if not can_ask:
            return Response(
                {"response": limit_msg, "success": False, "limit_exceeded": True},
                status=429,
            )
        data = serializer.validated_data
        response_text, success = chat(
            message=data["message"],
            path=data.get("path", "/"),
            conversation_history=data.get("conversation_history", []),
        )
        if success:
            increment_usage(store)
        return Response({"response": response_text, "success": success})
