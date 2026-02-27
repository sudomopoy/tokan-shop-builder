"""
سیستم افیلیت مارکتینگ توکان
"""
import uuid
import secrets
from django.db import models
from django.utils import timezone
from datetime import timedelta


def generate_referral_code():
    return secrets.token_urlsafe(16)[:24]


class AffiliateConfig(models.Model):
    """تنظیمات پیش‌فرض افیلیت (ادمین کل سیستم)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)
    default_commission_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=10,
        verbose_name="درصد کمیسیون پیش‌فرض"
    )
    default_duration_months = models.PositiveIntegerField(
        default=12,
        verbose_name="مدت اعتبار کمیسیون (ماه)"
    )

    class Meta:
        verbose_name = "تنظیمات افیلیت"
        verbose_name_plural = "تنظیمات افیلیت"

    @classmethod
    def get_config(cls):
        obj = cls.objects.first()
        if obj is None:
            obj = cls.objects.create()
        return obj


class UserAffiliateSettings(models.Model):
    """تنظیمات افیلیت به ازای هر کاربر - قابل تغییر توسط ادمین"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        "account.User",
        on_delete=models.CASCADE,
        related_name="affiliate_settings"
    )
    commission_percent = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        verbose_name="درصد کمیسیون (خالی = پیش‌فرض)"
    )
    duration_months = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="مدت اعتبار (ماه، خالی = پیش‌فرض)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "تنظیمات افیلیت کاربر"
        verbose_name_plural = "تنظیمات افیلیت کاربران"

    def get_commission_percent(self):
        if self.commission_percent is not None:
            return float(self.commission_percent)
        return float(AffiliateConfig.get_config().default_commission_percent)

    def get_duration_months(self):
        if self.duration_months is not None:
            return self.duration_months
        return AffiliateConfig.get_config().default_duration_months


class AffiliateInvite(models.Model):
    """دعوت افیلیت - چه کسی چه کسی رو دعوت کرده"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    inviter = models.ForeignKey(
        "account.User",
        on_delete=models.CASCADE,
        related_name="affiliate_invites"
    )
    invitee = models.ForeignKey(
        "account.User",
        on_delete=models.CASCADE,
        related_name="affiliate_invited_by"
    )
    commission_percent = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        verbose_name="درصد کمیسیون (خالی = پیش‌فرض)"
    )
    expires_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name="پایان اعتبار کمیسیون"
    )

    class Meta:
        verbose_name = "دعوت افیلیت"
        verbose_name_plural = "دعوت‌های افیلیت"
        ordering = ["-created_at"]
        unique_together = [("inviter", "invitee")]

    def get_commission_percent(self):
        if self.commission_percent is not None:
            return float(self.commission_percent)
        try:
            settings = UserAffiliateSettings.objects.get(user=self.inviter)
            return settings.get_commission_percent()
        except UserAffiliateSettings.DoesNotExist:
            return float(AffiliateConfig.get_config().default_commission_percent)

    def get_expires_at(self):
        if self.expires_at:
            return self.expires_at
        try:
            settings = UserAffiliateSettings.objects.get(user=self.inviter)
            months = settings.get_duration_months()
        except UserAffiliateSettings.DoesNotExist:
            months = AffiliateConfig.get_config().default_duration_months
        return self.created_at + timedelta(days=months * 30)

    def is_valid_for_commission(self):
        return timezone.now() <= self.get_expires_at()


class AffiliateEarning(models.Model):
    """کمیسیون افیلیت - بابت خرید دعوت‌شده"""
    STATUS_CHOICES = [
        ("pending", "در انتظار"),
        ("completed", "واریز شده"),
        ("cancelled", "لغو شده"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    invite = models.ForeignKey(
        AffiliateInvite,
        on_delete=models.CASCADE,
        related_name="earnings"
    )
    order = models.ForeignKey(
        "order.Order",
        on_delete=models.CASCADE,
        related_name="affiliate_earnings",
        null=True,
        blank=True
    )
    purchase_amount = models.DecimalField(
        max_digits=20, decimal_places=2,
        verbose_name="مبلغ خرید"
    )
    commission_amount = models.DecimalField(
        max_digits=20, decimal_places=2,
        verbose_name="مبلغ کمیسیون"
    )
    commission_percent = models.DecimalField(
        max_digits=5, decimal_places=2,
        verbose_name="درصد اعمال‌شده"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending"
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    description = models.CharField(
        max_length=500, blank=True,
        help_text="توضیح (برای کمیسیون دستی)"
    )

    class Meta:
        verbose_name = "کمیسیون افیلیت"
        verbose_name_plural = "کمیسیون‌های افیلیت"
        ordering = ["-created_at"]


class ManualAffiliateCredit(models.Model):
    """کمیسیون دستی توسط ادمین (خرید خارج از سیستم)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        "account.User",
        on_delete=models.CASCADE,
        related_name="manual_affiliate_credits"
    )
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    description = models.CharField(max_length=500)
    applied = models.BooleanField(
        default=False,
        verbose_name="واریز به کیف پول"
    )
    created_by = models.ForeignKey(
        "account.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_affiliate_credits"
    )

    class Meta:
        verbose_name = "کمیسیون دستی افیلیت"
        verbose_name_plural = "کمیسیون‌های دستی افیلیت"
        ordering = ["-created_at"]
