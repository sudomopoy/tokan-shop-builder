"""
مدل‌های اشتراک فروشگاه
- SubscriptionPlan: پلن اشتراک (مثل پایه، حرفه‌ای)
- SubscriptionPlanDuration: مدت و قیمت هر پلن (۱ ماهه، ۳ ماهه، ۱۲ ماهه با تخفیف)
- SubscriptionDiscountCode: کد تخفیف برای اشتراک
- SubscriptionGroupDiscount: تخفیف گروهی (مثلا خرید ۱۲ ماهه ۲۰٪ تخفیف)
"""
import uuid
from datetime import timedelta
from decimal import Decimal

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class SubscriptionPlan(models.Model):
    """پلن اشتراک فروشگاه - تعریف شده توسط ادمین سیستم"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    title = models.CharField(max_length=200, verbose_name="عنوان")
    description = models.TextField(blank=True, verbose_name="توضیحات")
    level = models.PositiveIntegerField(default=0, verbose_name="سطح")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    is_default = models.BooleanField(default=False, verbose_name="پلن پیش‌فرض")

    # ارتباط با Plan موجود فروشگاه (برای امکانات)
    store_plan = models.ForeignKey(
        "store.Plan",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subscription_plans",
        verbose_name="پلن فروشگاه",
    )
    # حداکثر تعداد ادمین‌های فروشگاه (0 = بدون ادمین، فیچر دیده می‌شود اما امکان تعریف نیست)
    max_admins = models.PositiveIntegerField(
        default=0,
        verbose_name="حداکثر ادمین",
        help_text="حداکثر تعداد ادمین‌های فروشگاه. 0 یعنی امکان تعریف ادمین نیست.",
    )
    # حداکثر سوال از هوش مصنوعی در هر روز (0 = بدون محدودیت)
    max_ai_questions_per_day = models.PositiveIntegerField(
        default=10,
        verbose_name="حداکثر سوال روزانه هوش مصنوعی",
        help_text="حداکثر تعداد سوال از دستیار هوش مصنوعی در هر روز. 0 یعنی نامحدود.",
    )
    # حداکثر تعداد محصولات فروشگاه (null = نامحدود)
    max_products = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="حداکثر محصولات",
        help_text="حداکثر تعداد محصولات قابل تعریف برای فروشگاه. خالی = نامحدود.",
    )
    # محدودیت به دسته‌های فروشگاه (خالی = همه دسته‌ها - شامل پلن رایگان)
    store_categories = models.ManyToManyField(
        "store.StoreCategory",
        blank=True,
        related_name="subscription_plans",
        verbose_name="دسته‌های فروشگاه",
        help_text="خالی = پلن برای همه دسته‌ها معتبر است",
    )

    class Meta:
        db_table = "subscription_plan"
        verbose_name = "پلن اشتراک"
        verbose_name_plural = "پلن‌های اشتراک"
        ordering = ["level", "title"]

    def __str__(self):
        return self.title

    @staticmethod
    def get_default():
        return SubscriptionPlan.objects.filter(is_default=True).first()

    def supports_store_category(self, store_category):
        """خالی بودن store_categories یعنی پلن برای همه دسته‌ها معتبر است"""
        if not store_category:
            return True
        if not self.store_categories.exists():
            return True
        return self.store_categories.filter(pk=store_category.pk).exists()


class SubscriptionPlanDuration(models.Model):
    """مدت و قیمت هر پلن - مثلا ۱ ماهه، ۳ ماهه، ۱۲ ماهه با تخفیف"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.CASCADE,
        related_name="durations",
        verbose_name="پلن",
    )
    duration_months = models.PositiveIntegerField(
        verbose_name="مدت (ماه)",
        validators=[MinValueValidator(1)],
    )
    base_price = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        validators=[MinValueValidator(0)],
        verbose_name="قیمت پایه (تومان)",
    )
    discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0"),
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="تخفیف درصدی",
    )
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        db_table = "subscription_plan_duration"
        verbose_name = "مدت پلن اشتراک"
        verbose_name_plural = "مدت‌های پلن اشتراک"
        unique_together = [["plan", "duration_months"]]
        ordering = ["plan", "duration_months"]

    def __str__(self):
        return f"{self.plan.title} - {self.duration_months} ماه"

    @property
    def final_price(self):
        """قیمت نهایی پس از اعمال تخفیف"""
        if self.discount_percent and self.discount_percent > 0:
            return self.base_price * (1 - self.discount_percent / 100)
        return self.base_price


class SubscriptionDiscountCode(models.Model):
    """کد تخفیف برای اشتراک"""
    DISCOUNT_TYPES = [
        ("percent", "درصدی"),
        ("fixed", "مبلغ ثابت"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    code = models.CharField(max_length=50, unique=True, verbose_name="کد")
    discount_type = models.CharField(
        max_length=10,
        choices=DISCOUNT_TYPES,
        default="percent",
        verbose_name="نوع تخفیف",
    )
    discount_value = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        validators=[MinValueValidator(0)],
        verbose_name="مقدار تخفیف",
    )
    max_uses = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="حداکثر استفاده",
        help_text="خالی = نامحدود",
    )
    used_count = models.PositiveIntegerField(default=0, verbose_name="تعداد استفاده")
    valid_from = models.DateTimeField(null=True, blank=True, verbose_name="اعتبار از")
    valid_until = models.DateTimeField(null=True, blank=True, verbose_name="اعتبار تا")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    # محدودیت به پلن خاص (خالی = همه پلن‌ها)
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="discount_codes",
        verbose_name="پلن (اختیاری)",
    )
    # حداقل مدت برای اعمال کد (ماه)
    min_duration_months = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="حداقل مدت (ماه)",
    )

    class Meta:
        db_table = "subscription_discount_code"
        verbose_name = "کد تخفیف اشتراک"
        verbose_name_plural = "کدهای تخفیف اشتراک"
        ordering = ["-created_at"]

    def __str__(self):
        return self.code

    def is_valid(self, plan=None, duration_months=None):
        now = timezone.now()
        if not self.is_active:
            return False, "کد غیرفعال است"
        if self.valid_from and now < self.valid_from:
            return False, "کد هنوز فعال نشده"
        if self.valid_until and now > self.valid_until:
            return False, "کد منقضی شده"
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False, "ظرفیت استفاده از کد تکمیل شده"
        if self.plan_id and plan and self.plan_id != plan.id:
            return False, "کد برای این پلن معتبر نیست"
        if self.min_duration_months and duration_months and duration_months < self.min_duration_months:
            return False, f"حداقل مدت برای این کد: {self.min_duration_months} ماه"
        return True, None

    def apply_discount(self, amount):
        """اعمال تخفیف روی مبلغ. مقدار تخفیف شده را برمی‌گرداند."""
        from decimal import Decimal
        if self.discount_type == "percent":
            return amount * self.discount_value / Decimal("100")
        return min(self.discount_value, amount)


class SubscriptionPayment(models.Model):
    """پرداخت اشتراک - برای تمدید فروشگاه"""
    STATUS_CHOICES = [
        ("pending", "در انتظار"),
        ("completed", "تکمیل شده"),
        ("failed", "ناموفق"),
        ("cancelled", "لغو شده"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    store = models.ForeignKey(
        "store.Store",
        on_delete=models.CASCADE,
        related_name="subscription_payments",
        verbose_name="فروشگاه",
    )
    payment = models.OneToOneField(
        "payment.Payment",
        on_delete=models.CASCADE,
        related_name="subscription_payment",
        null=True,
        blank=True,
        verbose_name="پرداخت",
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="payments",
        verbose_name="پلن",
    )
    duration_months = models.PositiveIntegerField(verbose_name="مدت (ماه)")
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        verbose_name="مبلغ پرداختی",
    )
    discount_code = models.ForeignKey(
        SubscriptionDiscountCode,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subscription_payments",
        verbose_name="کد تخفیف",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        verbose_name="وضعیت",
    )

    class Meta:
        db_table = "subscription_payment"
        verbose_name = "پرداخت اشتراک"
        verbose_name_plural = "پرداخت‌های اشتراک"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.store.name} - {self.plan.title} - {self.status}"

    def complete(self):
        """تمدید اشتراک فروشگاه پس از تکمیل پرداخت"""
        if self.status != "pending":
            return
        from store.models import Store
        store = self.store
        now = timezone.now()
        if store.subscription_expires_at and store.subscription_expires_at > now:
            base = store.subscription_expires_at
        else:
            base = now
        store.subscription_expires_at = base + timedelta(days=30 * self.duration_months)
        store.subscription_plan = self.plan
        store.save(update_fields=["subscription_expires_at", "subscription_plan"])
        from account.admin_utils import reconcile_store_admins_for_plan, reconcile_store_products_for_plan
        reconcile_store_admins_for_plan(store)
        reconcile_store_products_for_plan(store)
        self.status = "completed"
        self.save(update_fields=["status", "updated_at"])
        if self.discount_code:
            self.discount_code.used_count += 1
            self.discount_code.save(update_fields=["used_count", "updated_at"])
