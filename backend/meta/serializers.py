from rest_framework.serializers import ModelSerializer
from meta.models import Province, City


class ProvinceSerializer(ModelSerializer):
    class Meta:
        model = Province
        fields = "__all__"


class CitySerializer(ModelSerializer):
    class Meta:
        model = City
        fields = "__all__"
