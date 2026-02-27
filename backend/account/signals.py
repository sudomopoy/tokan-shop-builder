from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User
from wallet.models import Wallet


@receiver(post_save, sender=User)
def create_user_wallet(sender, instance, created, **kwargs):
    """کیف پول سراسری - ایجاد کیف پول به ازای هر کاربر جدید"""
    if created:
        Wallet.objects.get_or_create(user=instance)