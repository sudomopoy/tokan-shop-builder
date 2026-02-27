from rest_framework import viewsets, generics
from meta.serializers import CitySerializer, ProvinceSerializer
from meta.models import Province, City
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class ProvincesViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Province.objects.all()
    lookup_field = "name"
    serializer_class = ProvinceSerializer
    pagination_class = None  # Disable pagination for this view


class CitiesViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.all()
    lookup_field = "name"
    serializer_class = CitySerializer
    pagination_class = None  # Disable pagination for this view

    def get_queryset(self):
        """
        Filter cities by province if 'province' query parameter is provided.
        """
        queryset = super().get_queryset()
        province = self.request.query_params.get("province", None)
        if province:
            queryset = queryset.filter(province=province)
        return queryset

    @swagger_auto_schema(
        operation_id="list_cities",
        operation_description="List all cities, optionally filtered by province.",
        manual_parameters=[
            openapi.Parameter(
                "province",
                openapi.IN_QUERY,
                description="Filter cities by province name.",
                type=openapi.TYPE_STRING,
            )
        ],
    )
    def list(self, request, *args, **kwargs):
        """
        Override the list method to handle filtering by province.
        """
        return super().list(request, *args, **kwargs)
