from django.db import models
import string
import random
import uuid
from analytics.models import Hit, HitCount
from django.contrib.contenttypes.models import ContentType

def generate_short_code():
    length = 6
    chars = string.ascii_letters + string.digits
    return "".join(random.choice(chars) for _ in range(length))


class ShortURL(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now=True)
    original_url = models.URLField(max_length=1000)
    short_code = models.CharField(
        max_length=10, unique=True, default=generate_short_code
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expire_at = models.DateTimeField(auto_now_add=True)
    clicks = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.original_url} -> {self.short_code}"

    @property
    def hits(self):
        return HitCount.increment(self)

    def get_visits(self):
        content_type = ContentType.objects.get_for_model(self)
        return Hit.objects.filter(content_type=content_type, object_id=self.pk)

    def get_unique_visitors_count(self):
        return self.get_visits().values("session_key").distinct().count()
