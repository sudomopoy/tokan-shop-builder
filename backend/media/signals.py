import os
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.conf import settings
from .models import Media

# فقط وقتی S3 ست شده باشد کلاینت boto3 ساخته می‌شود
s3_client = None
if getattr(settings, "USE_S3", False):
    import boto3
    s3_client = boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


@receiver(post_delete, sender=Media)
def delete_media_file(sender, instance, **kwargs):
    if not instance.file:
        return
    if s3_client and getattr(settings, "USE_S3", False):
        try:
            s3_client.delete_object(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                Key=f"files/{instance.file.name}",
            )
        except Exception as e:
            print(f"Error deleting file from S3: {e}")
    else:
        # حذف فایل از ذخیرهٔ محلی
        path = instance.file.path if hasattr(instance.file, "path") else os.path.join(settings.MEDIA_ROOT, instance.file.name)
        try:
            if os.path.isfile(path):
                os.remove(path)
        except Exception as e:
            print(f"Error deleting local media file: {e}")

