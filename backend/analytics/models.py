from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from user_agents import parse
import hashlib
import os


class Hit(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    visited_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    referer = models.URLField(null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)

    # اطلاعات استخراج شده
    device_type = models.CharField(max_length=50, null=True, blank=True)
    browser = models.CharField(max_length=100, null=True, blank=True)
    os = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        ordering = ["-visited_at"]
        verbose_name = "بازدید"
        verbose_name_plural = "بازدیدها"
        unique_together = ("content_type", "object_id", "session_key")
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["ip_address"]),
            models.Index(fields=["session_key"]),
        ]

    def save(self, *args, **kwargs):
        # ایجاد کلید نشست برای تشخیص بازدیدهای تکراری
        if not self.session_key and self.ip_address and self.user_agent:
            raw_key = f"{self.ip_address}-{self.user_agent}"
            self.session_key = hashlib.md5(raw_key.encode()).hexdigest()

        # تجزیه user agent
        if self.user_agent:
            user_agent = parse(self.user_agent)
            self.browser = (
                f"{user_agent.browser.family} {user_agent.browser.version_string}"
            )
            self.os = f"{user_agent.os.family} {user_agent.os.version_string}"
            self.device_type = self.get_device_type(user_agent)

        # تشخیص موقعیت جغرافیایی
        # if self.ip_address and not self.ip_address.startswith("127."):
        #     try:
        #         geoip_path = os.path.join(
        #             os.path.dirname(__file__), "GeoLite2-City.mmdb"
        #         )
        #         with geoip2.database.Reader(geoip_path) as reader:
        #             response = reader.city(self.ip_address)
        #             self.country = response.country.name
        #             self.city = response.city.name
        #     except:
        #         pass

        super().save(*args, **kwargs)

    def get_device_type(self, user_agent):
        if user_agent.is_mobile:
            return "موبایل"
        elif user_agent.is_tablet:
            return "تبلت"
        elif user_agent.is_pc:
            return "کامپیوتر"
        elif user_agent.is_bot:
            return "ربات"
        return "سایر"

    @classmethod
    def add_hit(cls, obj, request):
        # بررسی وجود بازدید تکراری
        session_key = cls.generate_session_key(request)
        content_type = ContentType.objects.get_for_model(obj)

        if not cls.objects.filter(
            content_type=content_type, object_id=obj.pk, session_key=session_key
        ).exists():

            hit = cls(
                content_object=obj,
                ip_address=cls.get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT"),
                referer=request.META.get("HTTP_REFERER"),
                session_key=session_key,
            )
            hit.save()
            return True
        return False

    @staticmethod
    def generate_session_key(request):
        ip = Hit.get_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")
        raw_key = f"{ip}-{user_agent}"
        return hashlib.md5(raw_key.encode()).hexdigest()

    @staticmethod
    def get_client_ip(request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip


class HitCount(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    hits = models.PositiveIntegerField(default=0)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "شمارنده بازدید"
        verbose_name_plural = "شمارنده بازدیدها"
        unique_together = ("content_type", "object_id")

    @classmethod
    def increment(cls, obj):
        content_type = ContentType.objects.get_for_model(obj)
        hit_count, created = cls.objects.get_or_create(
            content_type=content_type, object_id=obj.pk
        )
        hit_count.hits += 1
        hit_count.save()
        return hit_count.hits
