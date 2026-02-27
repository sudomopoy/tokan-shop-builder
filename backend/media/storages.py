from storages.backends.s3boto3 import S3Boto3Storage
from django.utils import timezone
import os
import uuid

class MediaStorage(S3Boto3Storage):
    location = 'files'
    file_overwrite = False

    def _save(self, name, content):
        id = uuid.uuid4()
        filename, file_extension = os.path.splitext(name)
        current_date = timezone.now()
        name = f'{current_date.year}/{current_date.month}/{current_date.day}/{id}.{file_extension}'
        
        content.seek(0)
        return super(MediaStorage, self)._save(name, content)
