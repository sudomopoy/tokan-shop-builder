from slider.serializers import (
    SliderSerializer,
    SliderListSerializer,
    SliderDetailSerializer,
    SliderCreateUpdateSerializer,
    SlideSerializer,
    SlideCreateUpdateSerializer,
)
from rest_framework.permissions import AllowAny
from slider.models import Slider, Slide
from django.db.models import Prefetch
from django.db.models import Count
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from core.viewset import BaseStoreViewSet
from core.permissions import IsStoreOwner, IsStoreOwnerOnly


class SliderViewSet(BaseStoreViewSet):
    queryset = Slider.objects.all()
    serializer_class = SliderSerializer
    pagination_class = None
    lookup_field = "id"
    lookup_url_kwarg = "id"
    permission_classes = [IsStoreOwner]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            include_inactive = self.request.query_params.get("include_inactive") == "1"
            include_all_slides = self.request.query_params.get("include_all_slides") == "1"
            if include_inactive or include_all_slides:
                return [IsStoreOwnerOnly()]  # داشبورد: فقط مالک
            return [AllowAny()]
        return [IsStoreOwnerOnly()]  # create, update, delete: فقط مالک

    def get_queryset(self):
        queryset = super().get_queryset()
        include_inactive = self.request.query_params.get("include_inactive") == "1"
        is_store_owner = self._is_store_owner()

        if self.action == "list" and include_inactive and is_store_owner:
            queryset = queryset.annotate(_slides_count=Count("slides"))
            return queryset
        if self.action == "list":
            queryset = queryset.filter(is_active=True).annotate(
                _slides_count=Count("slides")
            )
            return queryset

        if self.action == "retrieve":
            include_all_slides = self.request.query_params.get("include_all_slides") == "1"
            if include_all_slides and is_store_owner:
                queryset = queryset.prefetch_related(
                    Prefetch("slides", queryset=Slide.objects.all().order_by("index"))
                )
            else:
                queryset = queryset.filter(is_active=True).prefetch_related(
                    Prefetch(
                        "slides",
                        queryset=Slide.objects.filter(is_active=True).order_by("index"),
                        to_attr="active_slides",
                    )
                )
        return queryset

    def _is_store_owner(self):
        if not getattr(self.request, "user", None) or not self.request.user.is_authenticated:
            return False
        if not hasattr(self.request, "store"):
            return False
        from account.models import StoreUser

        return StoreUser.objects.filter(
            store=self.request.store,
            user=self.request.user,
            level__gte=1,
        ).exists()

    def get_serializer_class(self):
        if self.action == "list":
            return SliderListSerializer
        if self.action == "retrieve":
            include_all_slides = self.request.query_params.get("include_all_slides") == "1"
            if include_all_slides and self._is_store_owner():
                return SliderDetailSerializer
        if self.action in ["create", "update", "partial_update"]:
            return SliderCreateUpdateSerializer
        return SliderSerializer

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "include_inactive",
                openapi.IN_QUERY,
                description="Include inactive sliders (for store owners)",
                type=openapi.TYPE_STRING,
            ),
        ],
        responses={200: SliderListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "include_all_slides",
                openapi.IN_QUERY,
                description="Include all slides including inactive (for store owners)",
                type=openapi.TYPE_STRING,
            ),
        ],
        responses={200: SliderSerializer()},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)


class SlideViewSet(BaseStoreViewSet):
    queryset = Slide.objects.all().select_related("desktop_image", "mobile_image")
    serializer_class = SlideSerializer
    pagination_class = None
    lookup_field = "id"
    lookup_url_kwarg = "id"
    permission_classes = [IsStoreOwner]

    def get_queryset(self):
        queryset = super().get_queryset().order_by("index")
        slider_id = self.request.query_params.get("slider")
        if slider_id:
            queryset = queryset.filter(slider_id=slider_id)
        return queryset

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return SlideCreateUpdateSerializer
        return SlideSerializer
