from django.db import models
from core.abstract_models import BaseStoreModel
import uuid
from store.models import STORE_LEVELS


class Feature(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=200,unique=True)
    description = models.TextField(default="",blank=True)
    minimum_store_level = models.PositiveIntegerField(default=0, choices=STORE_LEVELS)
    is_enabled = models.BooleanField(default=True)


class StoreFeature(BaseStoreModel):
    feature = models.ForeignKey('Feature')
    is_enabled = models.BooleanField(default=True)

    class Meta:
        unique_together = [("store","feature")]