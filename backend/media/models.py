# media/models.py
from django.db import models
from core.abstract_models import BaseStoreModel
import hashlib
from helper.image import optimize_to_webp
import mimetypes
from django.core.files.uploadedfile import InMemoryUploadedFile
from io import BytesIO
from PIL import Image

class Media(BaseStoreModel):
    owner = models.ForeignKey('account.User', null=True, on_delete=models.RESTRICT)
    title = models.CharField(max_length=300, default="", blank=True)
    description = models.TextField(blank=True, default="")
    # از storage پیش‌فرض تنظیمات استفاده می‌شود (S3 اگر ست شده، وگرنه ذخیرهٔ محلی)
    file = models.FileField(upload_to="media/")
    file_type = models.CharField(max_length=50, default="unknown", blank=True)
    file_size = models.PositiveBigIntegerField(default=0, blank=True)
    hash_sum = models.CharField(max_length=100, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    original_filename = models.CharField(max_length=300, blank=True)
    domain = models.CharField(max_length=100, default="storage.tokan.app", blank=True)
    is_deleted = models.BooleanField(default=False)  # برای soft delete

    def __str__(self):
        return self.title

    def optimize_image(self):
        """تبدیل تصویر به webp و فشرده‌سازی"""
        img = Image.open(self.file)
        img_io = BytesIO()
        img.save(img_io, format="WEBP", quality=80)
        img_io.seek(0)
        self.file = InMemoryUploadedFile(
            img_io, 'file', f"{self.file.name.split('.')[0]}.webp",
            'image/webp', img_io.getbuffer().nbytes, None
        )

    def save(self, *args, **kwargs):
        if not self.title:
            self.title = self.file.name
        self.original_filename = self.file.name

        # نوع و سایز فایل
        self.file_type = self.file.file.content_type
        self.file_size = self.file.size

        # بهینه‌سازی اگر عکس است
        if self.file_type.startswith("image/"):
            self.optimize_image()
            self.file_size = self.file.size
            self.file_type = "image/webp"

        # محاسبه hash
        hasher = hashlib.sha256()
        for chunk in self.file.chunks():
            hasher.update(chunk)
        self.hash_sum = hasher.hexdigest()

        super().save(*args, **kwargs)
