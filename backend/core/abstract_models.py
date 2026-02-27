import uuid
from django.db import models
from core.middleware import get_current_request

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class BaseStoreModel(BaseModel):
    store = models.ForeignKey(
        "store.Store",
        on_delete=models.PROTECT,
    )
    def save(self, *args, **kwargs):
        if not self.store_id:  # فقط اگر قبلاً مقدار نگرفته
            request = get_current_request()
            if request and hasattr(request, "store"):
                self.store = request.store
        super().save(*args, **kwargs)
    class Meta:
        abstract = True
