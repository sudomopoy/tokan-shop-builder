from django.db import models
from article.models import *
from core.abstract_models import BaseStoreModel

class Tag(BaseStoreModel):
    name = models.CharField(max_length=100)
    class Meta:
        verbose_name = 'Tag'
        verbose_name_plural = 'Tags'
        indexes = [
            models.Index(fields=['name'])
        ]
    def __str__(self):
        return self.name