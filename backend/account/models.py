from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.abstract_models import BaseStoreModel
from account.managers import UserManager
import uuid
import secrets
import string

common_name = "کاربر"


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    username = models.CharField(max_length=300)
    mobile = models.CharField(
        _("phone number"), max_length=20, null=True, blank=True,unique=True
    )
    national_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
    )
    is_verified = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    USERNAME_FIELD = "mobile"
    REQUIRED_FIELDS = []

    mobile_verified = models.BooleanField(default=False)
    
    is_banned = models.BooleanField(default=False)
    
    objects = UserManager()
    email = None

    register_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(
        null=True,
        blank=True,
    )
    referral_code = models.CharField(
        max_length=5, unique=True, null=True, blank=True,
        verbose_name="کد لینک دعوت افیلیت"
    )
    referred_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referred_users",
        verbose_name="دعوت شده توسط"
    )

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.mobile
        if not self.referral_code and self.mobile:
            for _ in range(10):
                code = "".join(secrets.choice(string.ascii_uppercase) for _ in range(5))
                if not User.objects.filter(referral_code=code).exclude(pk=self.pk).exists():
                    self.referral_code = code
                    break
        return super().save(*args, **kwargs)

    def __str__(self):
        stores = StoreUser.objects.filter(user=self) or []
        stores_name = ", ".join([store.store.name or "" for store in stores])
        return f"{self.mobile} {stores_name}"


USER_LEVEL = (
    (0, "customer"),
    (1, "admin"),
    (2, "owner"),
)

# سطوح دسترسی در هر بخش: read, write, delete
PERMISSION_LEVELS = [
    ("read", "خواندن"),
    ("write", "ویرایش/نوشتن"),
    ("delete", "حذف"),
]


class StoreAdminPermission(models.Model):
    """
    دسترسی‌های تفکیک شده برای ادمین فروشگاه.
    فقط برای StoreUser با is_admin=True و level=1 استفاده می‌شود.
    owner (level=2) نیازی به این مدل ندارد - دسترسی کامل دارد.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store_user = models.OneToOneField(
        "StoreUser",
        on_delete=models.CASCADE,
        related_name="admin_permissions",
    )
    # محصولات
    products_read = models.BooleanField(default=False)
    products_write = models.BooleanField(default=False)
    products_delete = models.BooleanField(default=False)
    # کاربران
    users_read = models.BooleanField(default=False)
    users_write = models.BooleanField(default=False)
    users_delete = models.BooleanField(default=False)
    # سفارشات
    orders_read = models.BooleanField(default=False)
    orders_write = models.BooleanField(default=False)
    orders_delete = models.BooleanField(default=False)
    # بلاگ
    blog_read = models.BooleanField(default=False)
    blog_write = models.BooleanField(default=False)
    blog_delete = models.BooleanField(default=False)
    # رزرواسیون (ارائه‌دهندگان، سرویس‌ها، رزروها)
    reservation_read = models.BooleanField(default=False)
    reservation_write = models.BooleanField(default=False)
    reservation_delete = models.BooleanField(default=False)
    # نظرات محصولات
    reviews_read = models.BooleanField(default=False)
    reviews_write = models.BooleanField(default=False)
    reviews_delete = models.BooleanField(default=False)
    # مدیا: خواندن و ویرایش پیش‌فرض برای همه ادمین‌ها، حذف با این پرچم
    media_delete = models.BooleanField(default=False)

    class Meta:
        db_table = "account_storeadminpermission"
        verbose_name = "دسترسی ادمین فروشگاه"
        verbose_name_plural = "دسترسی‌های ادمین فروشگاه"


class StoreUser(BaseStoreModel):
    user = models.ForeignKey('User', on_delete=models.RESTRICT)
    entry_source = models.CharField(max_length=300, default="unknown")

    email = models.EmailField(_("email address"), null=True, blank=True)
    level = models.PositiveIntegerField(default=0, choices=USER_LEVEL)
    display_name = models.CharField(
        max_length=300, default=common_name, null=True, blank=True
    )
    register_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(
        null=True,
        blank=True,
    )
    is_admin = models.BooleanField(default=False)
    # غیرفعال موقت وقتی تعداد ادمین‌ها از حد مجاز پلن بیشتر شده (دسترسی‌ها حفظ می‌شوند)
    is_admin_active = models.BooleanField(default=True)
    # مسدود در فروشگاه (توسط owner)
    is_blocked = models.BooleanField(default=False)

    is_vendor = models.BooleanField(default=False)
    email_is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.store.name} {self.user.mobile}"

    @property
    def is_store_owner(self):
        """مالک فروشگاه = store.owner یا level=2"""
        return self.level == 2 or (
            getattr(self.store, "owner_id", None)
            and self.store.owner_id == self.user_id
        )

    def has_section_permission(self, section, action):
        """
        section: 'products', 'users', 'orders', 'blog', 'reviews', 'media'
        action: 'read', 'write', 'delete'
        owner همیشه True برمی‌گرداند.
        برای media: خواندن و ویرایش پیش‌فرض برای همه ادمین‌ها، حذف با media_delete.
        """
        if self.is_store_owner:
            return True
        if not self.is_admin or not self.is_admin_active:
            return False
        if section == "media":
            if action in ("read", "write"):
                return True  # پیش‌فرض برای همه ادمین‌ها
            if action == "delete":
                try:
                    return getattr(self.admin_permissions, "media_delete", False)
                except StoreAdminPermission.DoesNotExist:
                    return False
        try:
            perms = self.admin_permissions
        except StoreAdminPermission.DoesNotExist:
            return False
        attr = f"{section}_{action}"
        return getattr(perms, attr, False)
class Address(BaseStoreModel):
    store_user = models.ForeignKey("account.StoreUser", on_delete=models.CASCADE,null=True)

    recipient_fullname = models.CharField(max_length=300)
    phone_number = models.CharField(max_length=20)
    address_line1 = models.TextField()
    postcode = models.CharField(max_length=30, null=True, blank=True, default="")
    province = models.ForeignKey("meta.Province", on_delete=models.CASCADE)
    city = models.ForeignKey("meta.City", on_delete=models.CASCADE)
    frequently_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not Address.objects.filter(store_user=self.store_user.pk, frequently_used=True).exists():
            self.frequently_used = True
        if not self.store_user.display_name or self.store_user.display_name == common_name:
            self.store_user.display_name = self.recipient_fullname
            self.store_user.save()
        super().save(*args, **kwargs)



# account/models.py
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _

BANK_ACCOUNT_STATUS = (
    ("pending", "در انتظار بررسی"),
    ("approved", "تأیید شده"),
    ("rejected", "رد شده"),
)

class BankAccount(BaseStoreModel):
    user = models.ForeignKey("account.User", on_delete=models.CASCADE, related_name="bank_accounts")
    iban = models.CharField(
        _("شماره شبا"),
        max_length=26,
        blank=True,
        validators=[
            RegexValidator(r"^IR\d{24}$", "شماره شبا باید با IR شروع شود و ۲۴ رقم بعدی عدد باشد.")
        ],
    )
    card_number = models.CharField(
        _("شماره کارت"),
        max_length=16,
        blank=True,
        validators=[
            RegexValidator(r"^\d{16}$", "شماره کارت باید ۱۶ رقم باشد.")
        ],
    )
    status = models.CharField(max_length=20, choices=BANK_ACCOUNT_STATUS, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if not self.iban and not self.card_number:
            raise ValidationError("حداقل یکی از شماره شبا یا شماره کارت باید وارد شود.")

    def __str__(self):
        return f"{self.user.mobile} - {self.iban or self.card_number}"

    def send_status_sms(self):
        # اینجا بعداً متد ارسال پیامک رو اضافه می‌کنیم
        pass
