# media/serializers.py
from rest_framework import serializers
from .models import Media
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum
class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = '__all__'
        read_only_fields = ('owner', 'file_type', 'file_size', 'hash_sum', 'uploaded_at', 'original_filename', 'domain', 'store','is_deleted')

    def validate_file(self, file):
        user = self.context['request'].user
        store_user = self.context['request'].store_user
        max_media_upload_per_day = 5
        if store_user.is_admin:
            max_media_upload_per_day = 100

        # بررسی حجم کل آپلودهای قبلی کاربر
        total_size = Media.objects.filter(owner=user, is_deleted=False).aggregate(total=Sum('file_size'))['total'] or 0
        max_size = 10 * 1024 * 1024  # ۱۰ مگابایت
        if total_size > 200 * 1024 * 1024:
            max_size = 3 * 1024 * 1024  # ۳ مگابایت

        if file.size > max_size:
            raise serializers.ValidationError(f"حداکثر حجم فایل مجاز {max_size / 1024 / 1024:.0f} مگابایت است.")

        # بررسی فرمت مجاز: عکس، ویدئو، و فایل‌های مستندات (برای محصولات دانلودی)
        allowed = (
            file.content_type.startswith('image/')
            or file.content_type.startswith('video/')
            or file.content_type.startswith('application/')
            or file.content_type.startswith('text/')
            or file.content_type == 'audio/mpeg'
            or file.content_type == 'audio/wav'
        )
        if not allowed:
            raise serializers.ValidationError("فرمت فایل مجاز نیست.")

        # محدودیت روزانه آپلود عکس
        if file.content_type.startswith('image/'):
            today = timezone.now().date()
            daily_count = Media.objects.filter(
                owner=user,
                uploaded_at__date=today,
                file_type__startswith='image',
                is_deleted=False
            ).count()
            if daily_count >= max_media_upload_per_day:
                raise serializers.ValidationError("شما امروز بیش از ۱۰۰ عکس آپلود کرده‌اید.")

        return file

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
