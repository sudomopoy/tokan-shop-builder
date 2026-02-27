from django.db.models.signals import post_save
from django.dispatch import receiver
from product.models import Product

from .tasks import process_video_to_hls_task


@receiver(post_save, sender=Product)
def on_product_streaming_video_saved(sender, instance, created, **kwargs):
    """وقتی محصول استریم با ویدیوی آپلودشده ذخیره شد، تبدیل HLS را صف می‌کند."""
    if instance.digital_subtype != "streaming":
        return
    if getattr(instance, "streaming_source", "external_link") != "uploaded":
        return
    if not instance.streaming_video_id:
        return
    process_video_to_hls_task.delay(str(instance.id))
