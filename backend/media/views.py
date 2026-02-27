# media/views.py
from rest_framework import mixins, viewsets, filters
from .models import Media
from .serializers import MediaSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from core.permissions import IsStoreCustomer, IsStoreOwner, IsSuperStoreOwner, HasMediaDeletePermission
from rest_framework.decorators import action
from rest_framework.response import Response

class MediaViewSet(mixins.CreateModelMixin,
                   mixins.ListModelMixin,
                   mixins.RetrieveModelMixin,
                   mixins.UpdateModelMixin,
                   mixins.DestroyModelMixin,
                   viewsets.GenericViewSet):
    serializer_class = MediaSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_permissions(self):
        if self.action in ['soft_delete']:
            return [IsSuperStoreOwner()]
        if self.action in ['destroy']:
            return [HasMediaDeletePermission()]  # owner یا ادمین با media_delete
        if self.action in ['list']:
            return [IsStoreOwner()]  # مالک یا ادمین فروشگاه می‌توانند لیست مدیا را ببینند
        return [IsStoreCustomer()]

    def get_queryset(self):
        qs = Media.objects.filter(is_deleted=False)
        if self.request.user.has_perm('IsSuperStoreOwner'):
            # سوپرمالک → فیلتر بر اساس پارامترها
            size_min = self.request.query_params.get('size_min')
            size_max = self.request.query_params.get('size_max')
            if size_min:
                qs = qs.filter(file_size__gte=int(size_min))
            if size_max:
                qs = qs.filter(file_size__lte=int(size_max))
            return qs
        # مالک/ادمین فروشگاه → همه مدیاهای همان فروشگاه
        if hasattr(self.request, 'store'):
            return qs.filter(store=self.request.store)
        return qs.filter(owner=self.request.user)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter('file', openapi.IN_FORM, description="File to upload", type=openapi.TYPE_FILE, required=True),
        ]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsSuperStoreOwner])
    def soft_delete(self, request, pk=None):
        media = self.get_object()
        media.is_deleted = True
        media.save()
        return Response({"status": "soft deleted"})
