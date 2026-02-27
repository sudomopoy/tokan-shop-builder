from django.db import models
import uuid
from django.utils.crypto import get_random_string
import secrets
import re
from django.core.validators import URLValidator, MinValueValidator, MaxValueValidator
validate_url = URLValidator()
import re

import wallet

def is_valid_subdomain(name):
    """
    Check if a string is a valid subdomain name with reserved word checks,
    including Persian/English words, brands, personal names, and geographic names.

    Rules:
    - Must be between 1 and 63 characters long
    - Can only contain a-z, 0-9, and hyphens (-)
    - Cannot start or end with a hyphen
    - Cannot be empty
    - Cannot be a reserved word (brands, names, places, etc.)

    Args:
        name (str): The subdomain name to validate

    Returns:
        bool: True if valid, False otherwise
    """
    if not isinstance(name, str):
        return False

    name = name.lower().strip()

    # Basic length check
    if not name or len(name) > 63:
        return False

    # Regex pattern for valid characters and structure
    pattern = r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$"
    if not re.fullmatch(pattern, name):
        return False

    # === Reserved Words List ===
    reserved_words = {
        # --- Technical Terms ---
        "www",
        "mail",
        "ftp",
        "smtp",
        "pop",
        "imap",
        "admin",
        "test",
        "localhost",
        "dev",
        "stage",
        "prod",
        "api",
        "cdn",
        "db",
        "sql",
        "ns1",
        "ns2",
        "dns",
        "web",
        "app",
        "blog",
        "shop",
        "portal",
        # --- English Common Words ---
        "root",
        "server",
        "system",
        "network",
        "account",
        "user",
        "login",
        "register",
        "signup",
        "verify",
        "password",
        "config",
        "setting",
        # --- Persian Common Words (Transliterated) ---
        "khodro",
        "mashin",
        "sandogh",
        "post",
        "dakheli",
        "shabakeh",
        "meli",
        "bank",
        "salamat",
        "pezeshki",
        "darman",
        "bimeh",
        "hamrah",
        "pardazesh",
        "fanni",
        "poshtibani",
        "moshaver",
        "sabtenam",
        "vurud",
        "ax",
        "aks",
        "film",
        "video",
        "musighi",
        # --- Offensive/Inappropriate Words ---
        "sex",
        "porn",
        "jens",
        "qazi",
        "haram",
        "gheyb",
        "fohsh",
        # === Famous Brands (Global & Persian) ===
        "google",
        "apple",
        "microsoft",
        "amazon",
        "samsung",
        "tesla",
        "digikala",
        "snapp",
        "tapsi",
        "alibaba",
        "shein",
        "namava",
        "filimo",
        "divar",
        "torob",
        "banipal",
        "snappfood",
        # === Popular Human Names (Global & Persian) ===
        "ali",
        "mohammad",
        "reza",
        "ahmad",
        "hossein",
        "fatemeh",
        "zahra",
        "maryam",
        "sara",
        "john",
        "michael",
        "david",
        "sarah",
        "emma",
        "mina",
        "parsa",
        "armin",
        "arya",
        "nima",
        "soroush",
        # === Celebrities & Public Figures ===
        "perspolis",
        "esteghlal",
        "tara",
        "googoosh",
        "ebi",
        "moein",
        "shajarian",
        "messi",
        "ronaldo",
        "neymar",
        "zidane",
        "mohsen",
        # === Countries (English & Persian Transliterated) ===
        "iran",
        "usa",
        "canada",
        "germany",
        "france",
        "china",
        "japan",
        "turkey",
        "uae",
        "england",
        "spain",
        "italy",
        "russia",
        "india",
        "afghanistan",
        "iraq",
        "pakistan",
        "brazil",
        "mexico",
        # === Iranian Provinces & Major Cities ===
        "tehran",
        "mashhad",
        "isfahan",
        "tabriz",
        "shiraz",
        "karaj",
        "ahvaz",
        "qom",
        "kermanshah",
        "urmia",
        "rasht",
        "zahedan",
        "kerman",
        "yazd",
        "ardabil",
        "bandarabbas",
        "arak",
        "sari",
        "esfahan",
        "hamedan",
        "qazvin",
        "zanjan",
        "kish",
        "qeshm",
        # === Other Major Global Cities ===
        "newyork",
        "losangeles",
        "london",
        "paris",
        "berlin",
        "tokyo",
        "dubai",
        "mumbai",
        "beijing",
        "shanghai",
        "sydney",
        "toronto",
        "istanbul",
        "moscow",
        "rome",
        "madrid",
        "barcelona",
        # --- Numbers-only subdomains (often problematic) ---
        "0",
        "1",
        "00",
        "01",
        "000",
        "123",
        "1234",
        "12345",
        "111",
        "100",
    }

    # Check against reserved words
    if name in reserved_words:
        return False

    # Check for numbers-only subdomains (if not already in reserved)
    if name.isdigit():
        return False
    if len(name) < 3:
        return False
    return True


class SettingDefinition(models.Model):
    temp_id = models.UUIDField(default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True)
    type = models.CharField(
        max_length=20,
        choices=[
            ("color", "Color"),
            ("int", "Integer"),
            ("float", "Float"),
            ("bool", "Boolean"),
            ("url", "URL"),
            ("text", "Text"),
        ],
    )
    default_value = models.TextField(null=True, blank=True)
    description = models.TextField(blank=True)
    can_edit_by_store = models.BooleanField(default=False)

    def __str__(self):
        return self.key


class StoreSetting(models.Model):
    temp_id = models.UUIDField( default=uuid.uuid4, editable=False)

    store = models.ForeignKey(
        "Store", on_delete=models.CASCADE, related_name="settings"
    )
    definition = models.ForeignKey("SettingDefinition", on_delete=models.CASCADE)
    value = models.TextField()
    @property
    def key(self):
        return self.definition.key
    class Meta:
        unique_together = ("store", "definition")

    def cast_value(value, type):
        if type == "int":
            return int(value)
        if type == "float":
            return float(value)
        if type == "bool":
            return value.lower() == "true"
        if type == "color":
            # validate that it's a hex color code
            if re.match(r"^#[0-9a-fA-F]{6}$", value):
                return value
            raise ValueError("Invalid color format")
        if type == "url":
            validate_url(value)  # از Django یا تابع سفارشی استفاده کن
        return value

    def get_store_value(self, store, key):
        try:
            definition = SettingDefinition.objects.get(key=key)
            setting = StoreSetting.objects.get(store=store, definition=definition)
            return self.cast_value(setting.value, definition.type)
        except StoreSetting.DoesNotExist:
            return self.cast_value(definition.default_value, definition.type)

    @staticmethod
    def get_settings(store):
        definitions = SettingDefinition.objects.all()

    def validate_key(key):
        if not SettingDefinition.objects.filter(key=key).exists():
            raise ValueError("کلید نامعتبر است")

    def __str__(self):
        return f"{self.store.name} {self.definition.key}"


class Plan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    title = models.CharField(max_length=300,default="---")
    level = models.PositiveIntegerField(default=0)

    shared_paymnent_percentage = models.DecimalField(default=0.10,max_digits=2, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(1)])
    is_default = models.BooleanField(default=False)
    def __str__(self):
        return self.title

    @staticmethod
    def get_default_plan():
        return Plan.objects.filter(is_default=True).first()
    class Meta:
        db_table = ''
        managed = True
        verbose_name = 'Plan'
        verbose_name_plural = 'Plans'
        
class StoreCategory(models.Model):
    """دسته‌بندی نوع فروشگاه: فیزیکی، دیجیتال، رزرواسیون"""
    SLUG_PHYSICAL = "physical"
    SLUG_DIGITAL = "digital"
    SLUG_DOWNLOAD = "download"
    SLUG_STREAMING = "streaming"
    SLUG_RESERVATION = "reservation"
    SLUG_CHOICES = [
        ("", "────────"),
        (SLUG_PHYSICAL, "فیزیکی (محصولات فیزیکی با ارسال)"),
        (SLUG_DIGITAL, "دیجیتال (غیرفیزیکی)"),
        (SLUG_DOWNLOAD, "دانلودی"),
        (SLUG_STREAMING, "استریمینگ"),
        (SLUG_RESERVATION, "رزرواسیون"),
    ]
    CAPABILITIES_BY_SLUG = {
        SLUG_PHYSICAL: {"requires_shipping": True, "requires_variants": True},
        SLUG_DIGITAL: {
            "requires_shipping": False,
            "supports_download": True,
            "supports_streaming": True,
            "supports_custom_inputs": True,
            "requires_variants": False,
        },
        SLUG_DOWNLOAD: {
            "requires_shipping": False,
            "supports_download": True,
            "supports_custom_inputs": True,
            "requires_variants": False,
        },
        SLUG_STREAMING: {
            "requires_shipping": False,
            "supports_streaming": True,
            "supports_custom_inputs": True,
            "requires_variants": False,
        },
        SLUG_RESERVATION: {"requires_reservation_flow": True},
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=50, unique=False, null=True, blank=True)
    icon = models.ForeignKey('media.Media', null=True, on_delete=models.SET_NULL)
    description = models.TextField(null=True, blank=True)
    index = models.PositiveIntegerField(null=True, blank=True)
    capabilities = models.JSONField(
        default=dict,
        blank=True,
        help_text="مثال: requires_shipping, requires_variants, supports_download, supports_streaming, supports_custom_inputs, requires_reservation_flow",
    )
    def __str__(self):
        return self.title
    
class Store(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    en_title = models.CharField(max_length=300,null=True,blank=True)
    store_category = models.ForeignKey('StoreCategory',null=True, blank=True, on_delete=models.RESTRICT , related_name='store_category')
    name = models.CharField(
        max_length=50,
        unique=True,
    )
    favicon = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="store_favicons",
    )
    minimal_logo = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="store_minimal_logos",
    )
    full_logo = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="store_full_logos",
    )
    external_domain = models.CharField(max_length=300, null=True,blank=True,unique=True)

    @property
    def internal_domain(self):
        if self._is_super_store:
            return f"{self.name}.{self.external_domain}"

        return f"{self.name}.{self.super_store.external_domain}"

    def get_website_url(self):
        """Return the store's website base URL for redirects (e.g. after payment)."""
        from django.conf import settings
        try:
            domain = self.internal_domain
            if domain:
                return f"https://{domain}" if not domain.startswith(("http://", "https://")) else domain
        except Exception:
            pass
        return getattr(settings, "WEBSITE_URL_BASE", "https://tokan.app")

    is_new = models.BooleanField(default=True)
    is_banned = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_shared_store = models.BooleanField(default=True)

    gift_percentage = models.DecimalField(default=0.10,max_digits=2, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(1)])
    has_gift = models.BooleanField(default=False)
    
    plan = models.ForeignKey('Plan',on_delete=models.RESTRICT,null=True,blank=True,related_name="store_plan")
    # اشتراک فروشگاه
    subscription_plan = models.ForeignKey(
        'subscription.SubscriptionPlan',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stores",
        verbose_name="پلن اشتراک",
    )
    subscription_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="تاریخ انقضای اشتراک",
    )
    description = models.TextField(default="",null=True,blank=True)
    slogan = models.TextField(default="",blank=True)
    theme = models.ForeignKey(
        "page.Theme",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="stores",
    )

    _dns_record_id = models.CharField(max_length=100, null=True, blank=True, unique=True)
    _jwt_secret = models.CharField(max_length=128, default=secrets.token_urlsafe)
    _is_super_store = models.BooleanField(default=False)
    is_multi_vendor = models.BooleanField(default=False)
    owner = models.ForeignKey(
        "account.User", on_delete=models.RESTRICT, related_name="stores",
        null=True
    )
    super_store = models.ForeignKey(
        "Store",null=True,blank=True, on_delete=models.RESTRICT, related_name="store_super_store"
    )
    
    @property
    def wallet(self):
        """کیف پول سراسری مالک فروشگاه"""
        import wallet
        return wallet.models.Wallet.objects.get(user=self.owner)
        
    @property
    def is_verified(self):
        return self.owner.is_verified
    
    def save(self, *args, **kwargs):
        # اطمینان از اینکه external_domain یک URL معتبر است
        if self.external_domain:
            self.is_shared_store = False
        if not self.is_shared_store and self.external_domain and not re.match(r"^(https?://)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", self.external_domain):
            raise ValueError("External domain must be a valid URL")
        if not is_valid_subdomain(self.name):
            raise ValueError("subdomain invalid name")
        if not self.en_title:
            self.en_title = self.name
        # if not self.owner:
        #     self.owner = User.objects.get(is_superuser=True)
        if not self.name:
            self.name = get_random_string(10, "abcdefghijklmnopqrstuvwxyz")
            
        # we have only one super store in system
        if self._is_super_store:
            if Store.objects.filter(_is_super_store=True).exclude(id=self.id).exists():
                self._is_super_store = False
                
        # super store owner user should be super user
        if self._is_super_store and not self.owner.is_superuser:
            raise ValueError("invalid super user")

        # banned store can not be active store
        if self.is_banned and self.is_active:
            self.is_active = False
        
        # if a store is not super store, should have a super store as parent
        if not self.super_store:
            self.super_store = Store.get_super_store()

        # super store cam not be shared store
        if self._is_super_store:
            self.is_shared_store = False
        
        # not shared store can not change back to shared store (once custom domain, stay custom)
        if self.pk:
            try:
                old = Store.objects.only("is_shared_store").get(pk=self.pk)
                if old.is_shared_store is False:
                    self.is_shared_store = False
            except Store.DoesNotExist:
                pass

        super().save(*args, **kwargs)

    @staticmethod
    def get_super_store():
        # Always return the instance, not the (instance, created) tuple
        return Store.objects.get_or_create(_is_super_store=True)[0]

    def __str__(self):
        return f"{self.id} {self.name}"

    @property
    def is_subscription_expired_over_10_days(self):
        """اشتراک حداقل ۱۰ روز منقضی شده؟"""
        if not self.subscription_expires_at:
            return True  # هیچ اشتراکی نداشته
        from django.utils import timezone
        from datetime import timedelta
        grace_end = self.subscription_expires_at + timedelta(days=10)
        return timezone.now() > grace_end

    @property
    def subscription_days_remaining(self):
        """تعداد روزهای باقی‌مانده تا انقضا. منفی = منقضی شده."""
        if not self.subscription_expires_at:
            return None
        from django.utils import timezone
        delta = self.subscription_expires_at - timezone.now()
        return delta.days

    def get_favicon(self):
        """
        اگر favicon وجود نداشت اما minimal_logo وجود داشت،
        از minimal_logo به عنوان favicon استفاده می‌کند
        """
        if self.favicon:
            return self.favicon
        elif self.minimal_logo:
            return self.minimal_logo
        return None

    @property
    def has_custom_domain(self):
        """فروشگاه دامنه اختصاصی خودش را ثبت کرده؟"""
        return bool(self.external_domain and self.external_domain.strip())


class SystemConfig(models.Model):
    """
    تنظیمات سیستمی قابل ویرایش از ادمین (مثل هزینه راه‌اندازی هوشمند).
    """
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField(blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.key}={self.value}"


class SmartSetupRequest(models.Model):
    """
    درخواست راه‌اندازی هوشمند فروشگاه.
    وقتی status=done شود، همه تسک‌های راه‌اندازی برای آن فروشگاه انجام‌شده تلقی می‌شوند.
    """
    STATUS_PENDING = "pending"
    STATUS_DONE = "done"
    STATUS_CHOICES = [(STATUS_PENDING, "در انتظار"), (STATUS_DONE, "انجام شد")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(
        "Store",
        on_delete=models.CASCADE,
        related_name="smart_setup_requests",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    current_stage = models.CharField(
        max_length=200,
        blank=True,
        help_text="مرحله فعلی (ادمین در پنل ادمین مشخص می‌کند)",
    )
    cost_amount = models.DecimalField(
        max_digits=15,
        decimal_places=0,
        default=0,
        help_text="مبلغ پرداختی (ریال)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.store} - {self.get_status_display()}"


class DomainChangeRequest(models.Model):
    """
    درخواست تغییر دامنه فروشگاه از دامنه اشتراکی به دامنه اختصاصی.
    منوط به تایید ادمین است. تا زمانی که تایید نشود، فروشگاه روی دامنه اشتراکی می‌ماند.
    """
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "در انتظار تایید"),
        (STATUS_APPROVED, "تایید شده"),
        (STATUS_REJECTED, "رد شده"),
        (STATUS_CANCELLED, "لغو شده"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(
        "Store",
        on_delete=models.CASCADE,
        related_name="domain_change_requests",
    )
    requested_domain = models.CharField(max_length=300)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        "account.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_domain_requests",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.store.name} -> {self.requested_domain} ({self.status})"


class SmartSetupPayment(models.Model):
    """پرداخت راه‌اندازی هوشمند - ارتباط Payment با SmartSetupRequest"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    smart_setup_request = models.OneToOneField(
        SmartSetupRequest,
        on_delete=models.CASCADE,
        related_name="payment_record",
    )
    payment = models.OneToOneField(
        "payment.Payment",
        on_delete=models.CASCADE,
        related_name="smart_setup_payment",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
