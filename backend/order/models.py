from django.db import models
from core.abstract_models import BaseStoreModel, BaseModel
from helper.sms import send_template_sms
from django.db import transaction as trx


class ShippingMethodDefinition(models.Model):
    """Global definition of a shipping method. Each store gets one ShippingMethod per definition (store settings)."""
    slug = models.SlugField(max_length=80, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    default_shipping_payment_on_delivery = models.BooleanField(default=False)
    default_product_payment_on_delivery = models.BooleanField(default=False)
    default_max_payment_on_delivery = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, default=None, blank=True
    )
    default_base_shipping_price = models.DecimalField(max_digits=20, decimal_places=2)
    default_shipping_price_per_extra_kilograms = models.DecimalField(
        max_digits=20, decimal_places=2, default=0.0
    )
    default_tracking_code_base_url = models.CharField(max_length=500, default="")

    class Meta:
        verbose_name = "Shipping method definition"
        verbose_name_plural = "Shipping method definitions"

    def __str__(self):
        return self.name


class ShippingMethod(BaseStoreModel):
    definition = models.ForeignKey(
        ShippingMethodDefinition,
        on_delete=models.PROTECT,
        related_name="store_methods",
        null=True,
        blank=True,
    )
    logo = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.RESTRICT,
    )
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    supported_cities = models.ForeignKey(
        "meta.City", null=True, blank=True, on_delete=models.RESTRICT
    )
    shipping_payment_on_delivery = models.BooleanField(default=False)
    product_payment_on_delivery = models.BooleanField(default=False)
    max_payment_on_delivery = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, default=None, blank=True
    )
    base_shipping_price = models.DecimalField(max_digits=20, decimal_places=2)
    shipping_price_per_extra_kilograms = models.DecimalField(
        max_digits=20, decimal_places=2, default=0.0
    )
    tracking_code_base_url = models.CharField(max_length=500, null=True, blank=True)
    is_active = models.BooleanField(
        default=True,
        help_text="غیرفعال کردن روش ارسال بدون حذف آن.",
    )

    class Meta:
        unique_together = ("store", "definition")

    @property
    def is_system_method(self):
        """True if this method comes from a definition (cannot be deleted by store)."""
        return self.definition_id is not None

    def __str__(self) -> str:
        return f"{self.name} {self.store.name}"

class Order(BaseStoreModel):
    PAYMENT_METHOD_CHOICES = [
        ("card_to_card", "Card to Card"),
        ("online", "Online Payment"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending Payment"),
        ("paid", "Paid"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
        ("failed", "Failed"),
    ]
    is_payed = models.BooleanField(default=False)
    is_completed= models.BooleanField(default=False)
    is_delivered= models.BooleanField(default=False)
    is_canceled= models.BooleanField(default=False)
    is_failed= models.BooleanField(default=False)

    store_user = models.ForeignKey("account.StoreUser", on_delete=models.CASCADE,null=True)

    products_total_amount = models.DecimalField(max_digits=20, decimal_places=2)
    payable_amount = models.DecimalField(max_digits=20, decimal_places=2)

    delivery_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0.00)
    # The `status` field in the `Order` model is used to track the current status of an order. It is a
    # CharField with choices defined in the `STATUS_CHOICES` list. The possible status values for an
    # order are:
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    code = models.IntegerField(unique=True, editable=False, null=True, blank=True)
    shipping_tracking_code = models.CharField(max_length=50, null=True, blank=True)
    shipping_method = models.ForeignKey(
        "ShippingMethod", null=True, on_delete=models.RESTRICT
    )
    delivery_address = models.ForeignKey(
        "account.Address", null=True, on_delete=models.CASCADE
    )
    transaction = models.ForeignKey('wallet.Transaction', null=True,on_delete=models.RESTRICT)

    @property
    def shipping_tracking_url(self):
        if not self.shipping_method:
            return ""
        base_url = self.shipping_method.tracking_code_base_url or ""
        return base_url.replace("%tracking_code%", self.shipping_tracking_code or "")

    def save(self, *args, **kwargs):
        # Track previous status to detect changes
        if self.pk:
            try:
                previous = Order.objects.get(pk=self.pk)
                previous_status = previous.status
            except Order.DoesNotExist:
                previous_status = None
        else:
            previous_status = None

        if not self.code:
            # Get the maximum code value from the database
            max_id = Order.objects.all().aggregate(models.Max("code"))["code__max"]
            # If no records exist yet, start with 10000, otherwise increment by 1
            self.code = max_id + 1 if max_id is not None else 10000
        
        # ارسال پیامک برای وضعیت paid
        if self.status == "paid" and previous_status != "paid":
            send_template_sms(
                [
                    {"Name": "USER", "Value": str(self.store_user.display_name)[:20]},
                    {"Name": "ORDER", "Value": str(self.code)},
                    {"Name": "STORE_NAME", "Value": str(self.store.title)},
                    {"Name": "STORE", "Value": str(self.store.name)},
                ],
                self.store_user.user.mobile,
                983777,
            )
        
        if self.status == "completed" and previous_status == "delivered" and not self.is_completed:
            self.is_completed = True

        if self.status == "delivered" and previous_status != "delivered" and not self.is_delivered:
            self.is_delivered = True

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.code} by {self.store_user}"

    def _deduct_stock(self):
        for item in self.items.all():
            if item.variant:
                if not getattr(item.variant, "stock_unlimited", False):
                    if item.variant.stock < item.quantity:
                        raise ValueError(f'موجودی کافی نیست: {item.variant}')
                    item.variant.stock -= item.quantity
                    item.variant.save()
            else:
                if not getattr(item.product, "stock_unlimited", False):
                    stock = item.product.stock or 0
                    if stock < item.quantity:
                        raise ValueError(f'موجودی کافی نیست: {item.product}')
                    item.product.stock = stock - item.quantity
                    item.product.save(update_fields=['stock'])

    def _restore_stock(self):
        for item in self.items.all():
            if item.variant:
                if not getattr(item.variant, "stock_unlimited", False):
                    item.variant.stock += item.quantity
                    item.variant.save()
            else:
                if not getattr(item.product, "stock_unlimited", False):
                    item.product.stock = (item.product.stock or 0) + item.quantity
                    item.product.save(update_fields=['stock'])

    @trx.atomic
    def complete_from_payment(self):
        """تکمیل سفارش پس از پرداخت موفق در درگاه (کسر موجودی، وضعیت paid)"""
        if self.status != "pending":
            return
        self._deduct_stock()
        self.status = "paid"
        self.is_payed = True
        self.save()
        # کمیسیون افیلیت (فقط خرید، نه واریز کیف پول)
        try:
            from affiliate.services import process_affiliate_commission_for_order
            process_affiliate_commission_for_order(self)
        except Exception:
            pass

    @trx.atomic
    def cancel_order(self):
        """لغو سفارش و بازگشت موجودی"""
        if self.status in ['delivered', 'completed']:
            raise ValueError('سفارش ارسال شده یا تکمیل شده قابل لغو نیست.')
        if self.status in ['cancelled', 'failed']:
            raise ValueError('سفارش قبلاً لغو شده است.')

        if self.status in ['paid', 'processing']:
            self._restore_stock()
        self.status = 'cancelled'
        self.is_canceled = True
        self.save()
        return True


class OrderItem(BaseStoreModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("product.Product",null=True, on_delete=models.PROTECT)
    
    variant = models.ForeignKey("product.Variant",null=True,blank=True, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=20, decimal_places=2)
    custom_input_values = models.JSONField(
        default=dict,
        blank=True,
        help_text="مقادیر ورودی سفارشی برای محصولات دیجیتال (key->value)",
    )
    def save(self, *args, **kwargs):
        if (self.variant):
            self.unit_price = self.variant.sell_price
        else:
            self.unit_price = self.product.sell_price
            
        return super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.quantity}x {self.variant} in Order {self.order.id}"
