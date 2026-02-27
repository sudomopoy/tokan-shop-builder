"""سرویس‌های افیلیت"""
from django.utils import timezone
from django.db import transaction
from decimal import Decimal


def process_affiliate_commission_for_order(order):
    """
    پس از پرداخت موفق سفارش، کمیسیون افیلیت را محاسبه و ثبت کن.
    فقط برای خرید (order) - نه واریز کیف پول و غیره.
    """
    from affiliate.models import AffiliateInvite, AffiliateEarning
    from wallet.models import Wallet

    if not order.store_user:
        return
    invitee_user = order.store_user.user
    try:
        invite = AffiliateInvite.objects.get(invitee=invitee_user)
    except AffiliateInvite.DoesNotExist:
        return
    if not invite.is_valid_for_commission():
        return

    purchase_amount = int(order.payable_amount)
    if purchase_amount <= 0:
        return

    commission_percent = invite.get_commission_percent()
    commission_amount = Decimal(purchase_amount) * Decimal(commission_percent) / 100

    with transaction.atomic():
        earning = AffiliateEarning.objects.create(
            invite=invite,
            order=order,
            purchase_amount=purchase_amount,
            commission_amount=commission_amount,
            commission_percent=commission_percent,
            status="completed",
            completed_at=timezone.now(),
            description=f"خرید سفارش #{order.code}",
        )
        wallet, _ = Wallet.objects.get_or_create(user=invite.inviter)
        wallet.add_withdrawable(int(commission_amount))
