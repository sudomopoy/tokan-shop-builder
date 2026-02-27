from django.db import models, transaction as trx
from django.conf import settings
from core.abstract_models import BaseModel, BaseStoreModel
from wallet.payment import PaymentService, PaymentRequest
from wallet.models import Wallet, Transaction, TransactionType


class PaymentGatewayType(BaseModel):
    """Gateway type identifier for routing to the correct service implementation."""
    name = models.CharField(max_length=100, unique=True)  # e.g. "zarinpal", "aghayepardakht"
    title = models.CharField(max_length=100)  # Display name e.g. "زرین پال"
    has_sandbox = models.BooleanField(default=False)  # Whether this gateway type supports sandbox/test mode
    # List of config keys to show in store settings. e.g. [{"key": "merchant_id", "label": "مرچنت آی دی", "type": "text", "required": true}]
    config_schema = models.JSONField(
        default=list,
        blank=True,
        help_text="List of {key, label, type: text|password|number, required} for gateway configuration.",
    )

    def __str__(self):
        return self.title


class PaymentGateway(BaseStoreModel):
    """Per-store payment gateway config. One per PaymentGatewayType per store (definition + store settings)."""
    gateway_type = models.ForeignKey(
        PaymentGatewayType, on_delete=models.PROTECT, related_name="gateways"
    )
    logo = models.ForeignKey(
        "media.Media", on_delete=models.CASCADE, null=True, blank=True
    )
    title = models.CharField(max_length=100)  # Store-specific display label
    configuration = models.JSONField(default=dict, blank=True)  # Configuration settings for the gateway
    is_sandbox = models.BooleanField(default=False)  # Use sandbox/test endpoints when True

    class Meta:
        unique_together = ("store", "gateway_type")

    def save(self, *args, **kwargs):
        if self.is_sandbox and self.gateway_type_id and not self.gateway_type.has_sandbox:
            raise ValueError(
                f"درگاه پرداخت {self.gateway_type.title} از حالت سندباکس پشتیبانی نمی‌کند."
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.gateway_type.title} {self.id}"


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"
    CANCELED = "canceled", "Canceled"

class PaymentStatusField(models.CharField):
    def __init__(self, *args, **kwargs):
        kwargs['choices'] = PaymentStatus.choices
        kwargs['max_length'] = 20
        super().__init__(*args, **kwargs)

class PaymentType(models.TextChoices):
    ONLINE = "online", "Online Payment"
    OFFLINE = "offline", "Offline Payment"
class PaymentTypeField(models.CharField):
    def __init__(self, *args, **kwargs):
        kwargs['choices'] = PaymentType.choices
        kwargs['max_length'] = 20
        super().__init__(*args, **kwargs)
class PaymentServiceManager:
    @staticmethod
    def create_payment_request(
        amount: int,
        gateway: PaymentGateway,
        transaction: "wallet.Transaction" = None,
        payment_link: str = None,
        authority: str = None,
        type: PaymentType = PaymentType.ONLINE,
    ) -> PaymentRequest:
        return PaymentService.create_payment_request(
            amount=amount,
            gateway=gateway,
            transaction=transaction,
            payment_link=payment_link,
            authority=authority,
            type=type
        )
class Payment(BaseStoreModel):
    amount = models.IntegerField()
    gateway = models.ForeignKey(
        PaymentGateway, on_delete=models.CASCADE, null=True, blank=True
    )
    order = models.ForeignKey(
        "order.Order", on_delete=models.CASCADE, null=True, blank=True, related_name="payments"
    )
    transaction = models.OneToOneField(
        "wallet.Transaction", on_delete=models.CASCADE, null=True, blank=True, related_name="payment"
    )
    payment_link = models.CharField(max_length=300, null=True, blank=True)
    authority = models.CharField(max_length=300,null=True, blank=True)
    documentary = models.ForeignKey(
        "media.Media", on_delete=models.CASCADE, null=True, blank=True, related_name="payment_documentry"
    )
    status = PaymentStatusField()
    is_online_payment = models.BooleanField(default=True)
    is_payed = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.gateway and self.gateway.store != self.store:
            raise ValueError("درگاه پرداخت باید متعلق به همین فروشگاه باشد.")
        super().save(*args, **kwargs)
    def complete(self):
        if not self.is_payed:
            if self.transaction:
                self.transaction.complete()
            self.status = PaymentStatus.COMPLETED
            self.is_payed = True
            self.save()
    
    @staticmethod
    @trx.atomic
    def create_online_payment(wallet:'Wallet', amount:int, gateway:'PaymentGateway'):
        """شارژ کیف پول سراسری - درگاه باید متعلق به super_store باشد"""
        transaction = None
        payment = None
        try:
            transaction = Transaction.objects.create(
                to_wallet=wallet,
                withdrawable_amount=amount,
                gift_amount=0,
                payment_method=TransactionType.DEPOSIT,
                has_online_payment=True
            )
            payment_service = PaymentService.get_instance(gateway)
            payment_req = PaymentRequest(
                amount=amount,
                description=f"transaction: {transaction.pk}",
                mobile=wallet.user.mobile or "09123456789",
                email="info@tokan.app",
                callback_url=((getattr(settings, "API_URL_BASE", "") or "") + "/wallet/verify_payment/"),
            )
            authority, payment_link, success = payment_service.init_payment(payment_req)
            if not success:
                if transaction:
                    transaction.delete()
                    raise ValueError('مشکلی در ساخت تراکنش وجود دارد.')

            payment = Payment.objects.create(
                store=gateway.store,
                amount=amount,
                gateway=gateway,
                transaction=transaction,
                is_online_payment=True,
                status=PaymentStatus.PENDING,
                authority=authority,
                payment_link=payment_link
            )
        except Exception as e:
            if transaction:
                transaction.delete()
            raise
        return payment

    @staticmethod
    @trx.atomic
    def create_order_payment(order, gateway):
        """پرداخت سفارش از طریق درگاه (بدون کیف پول)"""
        if order.store != gateway.store:
            raise ValueError("درگاه پرداخت باید متعلق به همین فروشگاه باشد.")
        if order.status != "pending":
            raise ValueError("وضعیت سفارش قابل پرداخت نیست.")

        amount = int(order.payable_amount)
        mobile = order.store_user.user.mobile if order.store_user else ""
        payment_service = PaymentService.get_instance(gateway)
        payment_req = PaymentRequest(
            amount=amount,
            description=f"سفارش #{order.code}",
            mobile=mobile or "09123456789",
            email="info@tokan.app",
            callback_url=((getattr(settings, "API_URL_BASE", "") or "") + "/wallet/verify_payment/"),
        )
        authority, payment_link, success = payment_service.init_payment(payment_req)
        if not success:
            raise ValueError("مشکلی در اتصال به درگاه پرداخت وجود دارد.")

        payment = Payment.objects.create(
            store=order.store,
            amount=amount,
            gateway=gateway,
            order=order,
            transaction=None,
            is_online_payment=True,
            status=PaymentStatus.PENDING,
            authority=authority,
            payment_link=payment_link or "",
        )
        return payment

    def __str__(self):
        return f"Payment {self.id} {self.authority}"
