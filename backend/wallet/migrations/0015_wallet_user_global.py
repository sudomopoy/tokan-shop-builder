# Migration: Convert Wallet from per-store to global user-based
# کیف پول سراسری - یک کیف پول به ازای هر کاربر در کل سیستم

from django.db import migrations, models
def migrate_to_user_wallets(apps, schema_editor):
    """Merge per-store wallets into one global wallet per user."""
    Wallet = apps.get_model("wallet", "Wallet")
    User = apps.get_model("account", "User")
    
    from collections import defaultdict
    
    # Get all wallets with owner
    wallets_with_owner = list(
        Wallet.objects.filter(owner__isnull=False).select_related("owner", "owner__user")
    )
    
    user_wallet_data = defaultdict(lambda: {"withdrawable": 0, "gift": 0, "blocked": 0, "ids": []})
    
    for w in wallets_with_owner:
        uid = w.owner.user_id
        user_wallet_data[uid]["withdrawable"] += float(w.withdrawable_balance or 0)
        user_wallet_data[uid]["gift"] += float(w.gift_balance or 0)
        user_wallet_data[uid]["blocked"] += float(w.blocked_balance or 0)
        user_wallet_data[uid]["ids"].append(w.id)
    
    # Create or update one wallet per user
    for user_id, data in user_wallet_data.items():
        # Use first wallet as base, update balances
        first_id = data["ids"][0]
        first_wallet = Wallet.objects.get(id=first_id)
        first_wallet.user_id = user_id
        first_wallet.withdrawable_balance = data["withdrawable"]
        first_wallet.gift_balance = data["gift"]
        first_wallet.blocked_balance = data["blocked"]
        first_wallet.save()
        
        # Delete other wallets for this user
        for wid in data["ids"][1:]:
            Wallet.objects.filter(id=wid).delete()
    
    # Create wallet for users who have StoreUser but no wallet (edge case)
    StoreUser = apps.get_model("account", "StoreUser")
    users_with_store = set(StoreUser.objects.values_list("user_id", flat=True).distinct())
    users_with_wallet = set(Wallet.objects.filter(user__isnull=False).values_list("user_id", flat=True))
    for uid in users_with_store - users_with_wallet:
        Wallet.objects.create(
            user_id=uid,
            withdrawable_balance=0,
            gift_balance=0,
            blocked_balance=0,
        )
    
    # Delete any leftover wallets without user (orphaned)
    Wallet.objects.filter(user__isnull=True).delete()


def reverse_migrate(apps, schema_editor):
    """Reverse is not fully supported - would need original store/owner data."""
    pass


class Migration(migrations.Migration):
    """کیف پول سراسری - جداسازی تراکنش‌ها برای جلوگیری از pending trigger events در PostgreSQL"""

    atomic = False

    dependencies = [
        ("account", "0019_storeadminpermission_media_delete"),
        ("wallet", "0014_alter_transaction_options"),
    ]

    operations = [
        migrations.AddField(
            model_name="wallet",
            name="user",
            field=models.OneToOneField(
                null=True,
                blank=True,
                on_delete=models.CASCADE,
                related_name="wallet",
                to="account.user",
            ),
        ),
        migrations.RunPython(migrate_to_user_wallets, reverse_migrate),
        migrations.RemoveField(
            model_name="wallet",
            name="owner",
        ),
        migrations.RemoveField(
            model_name="wallet",
            name="store",
        ),
        migrations.AlterField(
            model_name="wallet",
            name="user",
            field=models.OneToOneField(
                on_delete=models.CASCADE,
                related_name="wallet",
                to="account.user",
                null=False,
            ),
        ),
    ]
