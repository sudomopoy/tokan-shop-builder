from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import (
    AffiliateConfig,
    UserAffiliateSettings,
    AffiliateInvite,
    AffiliateEarning,
    ManualAffiliateCredit,
)


@admin.register(AffiliateConfig)
class AffiliateConfigAdmin(admin.ModelAdmin):
    list_display = ("default_commission_percent", "default_duration_months", "updated_at")


@admin.register(UserAffiliateSettings)
class UserAffiliateSettingsAdmin(admin.ModelAdmin):
    list_display = ("user", "commission_percent", "duration_months", "updated_at")
    search_fields = ("user__mobile", "user__username")
    raw_id_fields = ("user",)


@admin.register(AffiliateInvite)
class AffiliateInviteAdmin(admin.ModelAdmin):
    list_display = ("inviter", "invitee", "created_at", "commission_percent", "expires_at")
    search_fields = ("inviter__mobile", "invitee__mobile")
    raw_id_fields = ("inviter", "invitee")
    readonly_fields = ("created_at", "updated_at")


@admin.register(AffiliateEarning)
class AffiliateEarningAdmin(admin.ModelAdmin):
    list_display = ("invite", "order", "purchase_amount", "commission_amount", "commission_percent", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("invite__inviter__mobile", "invite__invitee__mobile", "description")
    raw_id_fields = ("invite", "order")
    readonly_fields = ("created_at", "updated_at")
    actions = ["mark_completed"]

    def mark_completed(self, request, queryset):
        from django.utils import timezone
        updated = 0
        for e in queryset.filter(status="pending"):
            e.status = "completed"
            e.completed_at = timezone.now()
            e.save()
            # Deposit commission into inviter wallet.
            from wallet.models import Wallet
            try:
                wallet, _ = Wallet.objects.get_or_create(user=e.invite.inviter)
                wallet.add_withdrawable(int(e.commission_amount))
                updated += 1
            except Exception:
                pass
        self.message_user(
            request,
            _("%(count)s commissions were deposited to wallet.") % {"count": updated},
        )
    mark_completed.short_description = _("Deposit to wallet")


@admin.register(ManualAffiliateCredit)
class ManualAffiliateCreditAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "description", "applied", "created_by", "created_at")
    list_filter = ("applied",)
    search_fields = ("user__mobile", "description")
    raw_id_fields = ("user", "created_by")
    readonly_fields = ("created_at", "updated_at")
    actions = ["apply_to_wallet"]

    def apply_to_wallet(self, request, queryset):
        from wallet.models import Wallet
        updated = 0
        for m in queryset.filter(applied=False):
            try:
                wallet, _ = Wallet.objects.get_or_create(user=m.user)
                wallet.add_withdrawable(int(m.amount))
                m.applied = True
                m.save()
                updated += 1
            except Exception:
                pass
        self.message_user(
            request,
            _("%(count)s records were deposited to wallet.") % {"count": updated},
        )
    apply_to_wallet.short_description = _("Deposit to wallet")
