import uuid
from django.db import models
from core.abstract_models import BaseStoreModel, BaseModel


class Notification(BaseStoreModel):
    store_user = models.ForeignKey("account.StoreUser", on_delete=models.CASCADE,null=True)
    user = models.ForeignKey("account.User", on_delete=models.CASCADE)
    is_sms = models.BooleanField(default=False)
    is_email = models.BooleanField(default=False)
    is_push = models.BooleanField(default=False)

    issued = models.BooleanField(default=False)

    scheduled_to = models.DateTimeField(null=True)

    def issue(self):
        self.issued = True
        self.save()
        pass


class StoreNotificationManager(BaseModel):
    available_sms_count = models.IntegerField(default=0)
    available_email_count = models.IntegerField(default=0)
    available_push_count = models.IntegerField(default=0)


# --- System Announcements (اعلانات سیستم) ---
# Generic, reusable by different parts of the system. Created via admin panel.

ANNOUNCEMENT_TYPE_CHOICES = (
    ("info", "اطلاعات"),
    ("warning", "هشدار"),
    ("success", "موفقیت"),
    ("announcement", "اعلان"),
)

ANNOUNCEMENT_SOURCE_CHOICES = (
    ("admin", "پنل ادمین"),
    ("system", "سیستم"),
    ("order", "سفارش"),
    ("product", "محصول"),
    ("blog", "بلاگ"),
    ("user", "کاربر"),
    ("other", "سایر"),
)


class SystemAnnouncement(models.Model):
    """
    اعلان سیستمی - قابل ایجاد از پنل ادمین.
    store=null یعنی برای همه فروشگاه‌ها؛ در غیر این صورت فقط برای آن فروشگاه.
    """
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    store = models.ForeignKey(
        "store.Store",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="خالی = همه فروشگاه‌ها",
    )
    title = models.CharField(max_length=300)
    message = models.TextField(blank=True)
    notification_type = models.CharField(
        max_length=50,
        choices=ANNOUNCEMENT_TYPE_CHOICES,
        default="announcement",
    )
    source = models.CharField(
        max_length=50,
        choices=ANNOUNCEMENT_SOURCE_CHOICES,
        default="admin",
    )
    link = models.CharField(max_length=500, blank=True, help_text="لینک اختیاری")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "اعلان سیستمی"
        verbose_name_plural = "اعلانات سیستمی"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class SystemAnnouncementRead(models.Model):
    """ردیابی خوانده شدن اعلان توسط کاربر فروشگاه"""
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    announcement = models.ForeignKey(
        SystemAnnouncement,
        on_delete=models.CASCADE,
        related_name="reads",
    )
    store_user = models.ForeignKey(
        "account.StoreUser",
        on_delete=models.CASCADE,
        related_name="announcement_reads",
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "خوانده شدن اعلان"
        verbose_name_plural = "خوانده شدن اعلانات"
        unique_together = [["announcement", "store_user"]]

    def __str__(self):
        return f"{self.store_user} - {self.announcement.title}" 
     