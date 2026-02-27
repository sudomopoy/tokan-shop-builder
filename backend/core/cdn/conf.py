from django.conf import settings

AWS_ACCESS_KEY_ID= settings.AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY= settings.AWS_SECRET_ACCESS_KEY
AWS_STORAGE_BUCKET_NAME= settings.AWS_STORAGE_BUCKET_NAME
AWS_S3_ENDPOINT_URL=settings.AWS_S3_ENDPOINT_URL
AWS_S3_OBJECT_PARAMETERS = {
    "CacheControl": "max-age=86400",
    "ACL": "public-read"
}
AWS_LOCATION= settings.AWS_LOCATION
DEFAULT_FILE_STORAGE = "core.cdn.backends.MediaRootS3BotoStorage"
STATICFILES_STORAGE = 'core.cdn.backends.StaticRootS3BotoStorage'