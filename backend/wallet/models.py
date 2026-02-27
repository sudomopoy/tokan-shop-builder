from django.db import models
from core.abstract_models import BaseModel
from django.db import transaction
import payment
import time
from django.db.models import Sum , F
import payment.models

class SystemAccountant(models.Model):
    recorded_total_withdrawable = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    recorded_total_gift = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    recorded_total_blocked = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    recorded_total_purchased = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    recorded_total_inner_transfered = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    recorded_total_deposit = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    recorded_total_withdrawed = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    recorded_total_to_withdraw = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    recorded_total_gift_used = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    
    @staticmethod
    def get_system_accountant():
        return SystemAccountant.objects.first()
    
    @property
    def shadow_total_withdrawable(self):
        result =  Wallet.objects.all().aggregate(Sum('withdrawable_balance'))
       
        return result['withdrawable_balance__sum'] or 0
    
    @property
    def shadow_total_gift(self):
        result =  Wallet.objects.all().aggregate(Sum('gift_balance'))
       
        return result['gift_balance__sum'] or 0

    
    @property
    def shadow_total_blocked(self):
        result =  Wallet.objects.all().aggregate(Sum('blocked_balance'))
       
        return result['blocked_balance__sum'] or 0
    
    @property
    def shadow_total_purchased(self):
        result =  Transaction.objects.filter(
            payment_method=TransactionType.PURCHASE,
            status=TransactionStatus.COMPLETED,
            is_payed=True
            ).aggregate(total_amount=Sum(F('withdrawable_amount')+F('gift_amount')))
       
        return result['total_amount'] or 0
    
    @property
    def shadow_total_inner_transfered(self):
        result =  Transaction.objects.filter(
            payment_method=TransactionType.INNER_TRANSFER,
            status=TransactionStatus.COMPLETED,
            is_payed=True
        ).aggregate(total_amount=Sum(F('withdrawable_amount')+F('gift_amount')))
       
        return result['total_amount'] or 0
    
    @property
    def shadow_total_deposit(self):
        result =  Transaction.objects.filter(
            payment_method=TransactionType.DEPOSIT,
            status=TransactionStatus.COMPLETED,
            is_payed=True
        ).aggregate(total_amount=Sum(F('withdrawable_amount')+F('gift_amount')))
       
        return result['total_amount'] or 0
    
    @property
    def shadow_total_withdrawed(self):
        result =  Transaction.objects.filter(
            payment_method=TransactionType.WITHDRAWAL,
            status=TransactionStatus.COMPLETED,
            is_payed=True
        ).aggregate(total_amount=Sum(F('withdrawable_amount')+F('gift_amount')))
       
        return result['total_amount'] or 0
    
    @property
    def shadow_total_to_withdraw(self):
        result =  Transaction.objects.filter(
            payment_method=TransactionType.WITHDRAWAL,
            status=TransactionStatus.PENDING,
            is_payed=False
        ).aggregate(total_amount=Sum(F('withdrawable_amount')+F('gift_amount')))
       
        return result['total_amount'] or 0
    
    @property
    def shadow_total_gift_used(self):
        result =  Transaction.objects.filter(
            payment_method__in=[TransactionType.PURCHASE,TransactionType.INNER_TRANSFER],
            status=TransactionStatus.COMPLETED,
            is_payed=True
        ).aggregate(Sum('gift_amount'))
       
        return result['gift_amount__sum'] or 0
    
class Wallet(BaseModel):
    """کیف پول سراسری - یک کیف پول به ازای هر کاربر در کل سیستم توکان (مختص فروشگاه نیست)"""
    user = models.OneToOneField(
        "account.User", on_delete=models.CASCADE, related_name="wallet"
    )
    withdrawable_balance = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    gift_balance = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    blocked_balance = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    
    gift_expire_time = models.DateTimeField(null=True,blank=True)
    @property
    def total_balance(self):
        return self.available_balance + self.blocked_balance

    @property
    def available_balance(self):
        return self.withdrawable_balance + self.gift_balance
    def calculate_gift_usable_amount(self, amount:int):
        #  returns withrable amount , gift amount to use
        #  always some of returns should be same amount

        if self.gift_balance >= amount:
            return 0 , amount
        else: 
            return amount - self.gift_balance , self.gift_balance 
    @transaction.atomic
    def block_funds(self, amount):
        if self.withdrawable_balance >= amount:
            self.blocked_balance += amount
            self.withdrawable_balance -= amount
            self.save()
            system = SystemAccountant.get_system_accountant()
            system.recorded_total_blocked += amount
            system.recorded_total_withdrawable -= amount
            system.save()
            return True
        return False
    
    @transaction.atomic
    def unblock_funds(self, amount):
        if self.blocked_balance >= amount:
            self.blocked_balance -= amount
            self.withdrawable_balance += amount
            self.save()
            
            system = SystemAccountant.get_system_accountant()
            system.recorded_total_blocked -= amount
            system.recorded_total_withdrawable += amount
            system.save()
            return True
        return False

    @transaction.atomic
    def add_withdrawable(self, amount:int):
        self.withdrawable_balance += amount
        system = SystemAccountant.get_system_accountant()
        system.recorded_total_withdrawable += amount
        system.save()
        self.save()
        
    @transaction.atomic
    def add_gift(self, amount:int):
        self.gift_balance += amount
        system = SystemAccountant.get_system_accountant()
        system.recorded_total_gift += amount
        system.save()
        self.save()
        
    @transaction.atomic
    def sub_withdrawable(self, amount:int):
        if self.withdrawable_balance >= amount:
            self.withdrawable_balance -= amount
            system = SystemAccountant.get_system_accountant()
            system.recorded_total_withdrawable -= amount
            system.recorded_total_withdrawed += amount
            
            system.save()
            self.save()
        else:
            raise ValueError("مقدار درخواستی از میزان در دسترس کیف پول بیشتر است.")
    
    @transaction.atomic
    def sub_gift(self, amount:int):
        if self.gift_expire_time.timestamp() < time.time():
            self.gift_balance = 0
            raise ValueError("مهلت استفاده از هدیه گذشته است.")
        if self.gift_balance >= amount:
            system = SystemAccountant.get_system_accountant()
            system.recorded_total_gift -= amount
            system.recorded_total_gift_used += amount
            
            system.save()
            self.gift_balance -= amount
        else:
            raise ValueError("مقدار درخواستی از میزان در دسترس کیف پول بیشتر است.")
        
        self.save()
        
    
    @transaction.atomic
    def purchase(self, 
                     amount:int, 
                     can_use_gift:bool = False) -> 'Transaction':
        if can_use_gift and amount > self.available_balance:
            raise ValueError("مقدار درخواستی از موجودی بیشتر است")
        
        if not can_use_gift and amount > self.withdrawable_balance:
            raise ValueError("مقدار درخواستی از موجودی بیشتر است")
        
        withdrawable_amount, gift_amount = self.calculate_gift_usable_amount(amount)
        if not can_use_gift:
            withdrawable_amount = amount
            gift_amount = 0
        system = SystemAccountant.get_system_accountant()
        system.recorded_total_purchased += amount
        system.recorded_total_gift -= gift_amount
        system.recorded_total_gift_used += gift_amount
        system.recorded_total_withdrawable -= withdrawable_amount
        
        system.save()
        return Transaction.objects.create(
            from_wallet=self,
            withdrawable_amount=withdrawable_amount,
            gift_amount=gift_amount,
            payment_method=TransactionType.PURCHASE,
        )
    @transaction.atomic
    def trenasfer_to(self, 
                     amount:int, 
                     to_wallet:'Wallet', 
                     can_use_gift:bool = False) -> 'Transaction':
        
        if can_use_gift and amount > self.available_balance:
            raise ValueError("مقدار درخواستی از موجودی بیشتر است")
        
        if not can_use_gift and amount > self.withdrawable_balance:
            raise ValueError("مقدار درخواستی از موجودی بیشتر است")
        
        withdrawable_amount, gift_amount = self.calculate_gift_usable_amount(amount)
        if not can_use_gift:
            withdrawable_amount = amount
            gift_amount = 0
        system = SystemAccountant.get_system_accountant()
        system.recorded_total_inner_transfered += amount
        system.recorded_total_gift -= gift_amount
        system.recorded_total_gift_used += gift_amount
        system.recorded_total_withdrawable -= withdrawable_amount
        
        system.save()
        return Transaction.objects.create(
            from_wallet=self,
            to_wallet=to_wallet,
            withdrawable_amount=withdrawable_amount,
            gift_amount=gift_amount,
            payment_method=TransactionType.INNER_TRANSFER,
        )
    
    @transaction.atomic
    def deposit_online(self, 
                amount:int, payment_gateway) -> 'payment.models.Payment':
            # کیف پول سراسری - درگاه پرداخت باید متعلق به super_store باشد
            from store.models import Store
            super_store = Store.get_super_store()
            if payment_gateway.store != super_store:
                raise ValueError("شارژ کیف پول توکان باید از طریق درگاه پرداخت پلتفرم انجام شود.")
            system = SystemAccountant.get_system_accountant()
            system.recorded_total_deposit += amount
            
            system.save()    
            [...]
            return payment.models.Payment.create_online_payment(
                self,
                amount,
                payment_gateway
            )
    @transaction.atomic
    def deposit_ofline(self, 
                amount:int, is_gift) -> 'payment.models.Payment':
        system = SystemAccountant.get_system_accountant()
        system.recorded_total_deposit += amount
            
        system.save()
        return Transaction.objects.create(
            to_wallet=self,
            withdrawable_amount= is_gift if 0 else amount,
            gift_amount= amount if is_gift else 0,
            payment_method=TransactionType.DEPOSIT,
            has_online_payment=False
        )     
    @transaction.atomic
    def withraw(self, amount:int):
        if amount > self.withdrawable_balance:
            raise ValueError("مقدار درخواستی از موجودی بیشتر است")
        system = SystemAccountant.get_system_accountant()
        system.recorded_total_withdrawable -= amount
        system.recorded_total_withdrawed -= amount
            
        system.save()
        return Transaction.objects.create(
            from_wallet=self,
            withdrawable_amount=amount,
            payment_method=TransactionType.WITHDRAWAL,
        ) 
    def __str__(self):
        return f"کیف پول {self.user.mobile}" 

class TransactionType(models.TextChoices):
    WITHDRAWAL = 'withdrawal', 'Withdrawal'
    DEPOSIT = 'deposit', 'Deposit'
    PURCHASE = 'purchase', 'Purchase'
    INNER_TRANSFER = "inner transfer"

class TransactionTypeField(models.CharField):
    def __init__(self, *args, **kwargs):
        kwargs['choices'] = TransactionType.choices
        kwargs['max_length'] = 20
        super().__init__(*args, **kwargs)

class TransactionManager(models.Manager):
    def create_transaction(self, from_wallet, to_wallet, amount, payment_method, status="pending", is_online_purchase=False, is_payed=False, is_gift=False):
        transaction = self.create(
            from_wallet=from_wallet,
            to_wallet=to_wallet,
            amount=amount,
            payment_method=payment_method,
            status=status,
            is_online_pruchase=is_online_purchase,
            is_payed=is_payed,
            is_gift=is_gift
        )
        return transaction

class TransactionQuerySet(models.QuerySet):
    def pending(self):
        return self.filter(status="pending")

    def completed(self):
        return self.filter(status="completed")

    def failed(self):
        return self.filter(status="failed")

    def canceled(self):
        return self.filter(status="canceled")


class TransactionStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    CANCELED = 'canceled', 'Canceled'

class TransactionStatusField(models.CharField):
    def __init__(self, *args, **kwargs):
        kwargs['choices'] = TransactionStatus.choices
        kwargs['max_length'] = 20
        super().__init__(*args, **kwargs)
class Transaction(BaseModel):

    from_wallet = models.ForeignKey("Wallet", 
                                    on_delete=models.CASCADE,
                                    null=True,
                                    blank=True,
                                    related_name="from_wallet"    
    )
    to_wallet = models.ForeignKey("Wallet", on_delete=models.CASCADE,
                                    null=True,
                                    blank=True,
                                    related_name="to_wallet"   )

    withdrawable_amount = models.DecimalField(
        max_digits=20,
        decimal_places=2,
    )
    gift_amount = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        default=0
    )
    payment_method = TransactionTypeField()
    timestamp = models.DateTimeField(auto_now_add=True)
    status = TransactionStatusField()
    has_online_payment = models.BooleanField(default=False)
    is_payed = models.BooleanField(default=False)
    
    @property
    def total_amount(self):
        return self.withdrawable_amount + self.gift_amount
    
    @transaction.atomic
    def fail(self):
        # revert transaction
        if self.is_payed:
            if self.to_wallet:
                self.to_wallet.sub_withdrawable(self.total_amount)
            if self.from_wallet:
                self.from_wallet.add_withdrawable(self.withdrawable_amount)
                if self.gift_amount > 0:
                    self.from_wallet.add_gift(self.gift_amount)
            self.is_payed = False
            
        self.status = TransactionStatus.CANCELED

        self.save()

    @transaction.atomic
    def cancel(self):
        if self.is_payed:
            raise ValueError("تراکنش پرداخت شده، قابل لغو نیست.")
        self.status = TransactionStatus.CANCELED

        self.save()

    @transaction.atomic
    def complete(self):
        if not self.is_payed and self.status != TransactionStatus.COMPLETED:
            if self.to_wallet:
                self.to_wallet.add_withdrawable(self.total_amount)
            if self.from_wallet:
                self.from_wallet.sub_withdrawable(self.withdrawable_amount)
                if self.gift_amount > 0:
                    self.from_wallet.sub_gift(self.gift_amount)

            self.is_payed = True
            self.status = TransactionStatus.COMPLETED
            self.save()
    def __str__(self):
        return f"Transaction {self.id} {self.payment_method} {self.total_amount} {self.from_wallet} -> {self.to_wallet}"
    
    class Meta:
                ordering = ['-created_at']


class WithdrawRequestStatus(models.TextChoices):
    PENDING = "pending", "در انتظار بررسی"
    APPROVED = "approved", "تایید شده"
    REJECTED = "rejected", "رد شده"
    DEPOSITED = "deposited", "واریز شده"


class WithdrawRequest(BaseModel):
    """درخواست برداشت از کیف پول سراسری"""
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name="withdraw_requests",
        verbose_name="کیف پول",
    )
    amount = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        verbose_name="مبلغ",
    )
    status = models.CharField(
        max_length=20,
        choices=WithdrawRequestStatus.choices,
        default=WithdrawRequestStatus.PENDING,
        verbose_name="وضعیت",
    )
    # اطلاعات بانکی
    bank_sheba_or_card = models.CharField(max_length=50, verbose_name="شماره شبا یا کارت")
    bank_name = models.CharField(max_length=100, verbose_name="نام بانک")
    account_holder = models.CharField(max_length=150, verbose_name="صاحب حساب")
    description = models.TextField(blank=True, verbose_name="توضیحات درخواست")
    # رد شدن
    rejection_reason = models.TextField(blank=True, verbose_name="دلیل رد (نمایش به کاربر)")
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey(
        "account.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rejected_withdraw_requests",
    )
    # واریز شده
    deposit_reference_id = models.CharField(max_length=100, blank=True, verbose_name="شناسه واریز")
    deposited_at = models.DateTimeField(null=True, blank=True)
    deposited_by = models.ForeignKey(
        "account.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deposited_withdraw_requests",
    )
    # تراکنش مرتبط (بعد از تایید)
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="withdraw_request",
    )

    class Meta:
        verbose_name = "درخواست برداشت"
        verbose_name_plural = "درخواست‌های برداشت"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.wallet.user.mobile} - {self.amount} - {self.status}" 