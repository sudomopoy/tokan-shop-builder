from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils.translation import gettext_lazy as _
from .models import *
from unfold.admin import ModelAdmin
from import_export.admin import ImportExportModelAdmin


class WalletAdmin(ImportExportModelAdmin):
    list_display = (
        'user_info',
        'withdrawable_balance_display',
        'gift_balance_display',
        'blocked_balance_display',
        'available_balance_display',
        'total_balance_display',
    )
    search_fields = (
        'user__mobile',
        'user__username',
    )
    readonly_fields = (
        'user',
        'withdrawable_balance',
        'gift_balance',
        'blocked_balance',
        'available_balance',
        'total_balance',
    )

    def user_info(self, obj):
        return f"{obj.user.mobile} ({obj.user.username})"
    user_info.short_description = _('User')
    
    def withdrawable_balance_display(self, obj):
        return _("%(amount)s Toman") % {"amount": f"{obj.withdrawable_balance:,.0f}"}
    withdrawable_balance_display.short_description = _('Withdrawable balance')
    
    def gift_balance_display(self, obj):
        return _("%(amount)s Toman") % {"amount": f"{obj.gift_balance:,.0f}"}
    gift_balance_display.short_description = _('Gift balance')
    
    def blocked_balance_display(self, obj):
        return _("%(amount)s Toman") % {"amount": f"{obj.blocked_balance:,.0f}"}
    blocked_balance_display.short_description = _('Blocked balance')
    
    def available_balance_display(self, obj):
        return _("%(amount)s Toman") % {"amount": f"{obj.available_balance:,.0f}"}
    available_balance_display.short_description = _('Available balance')
    
    def total_balance_display(self, obj):
        return _("%(amount)s Toman") % {"amount": f"{obj.total_balance:,.0f}"}
    total_balance_display.short_description = _('Total balance')
    
    def available_balance(self, obj):
        return obj.available_balance
    
    def total_balance(self, obj):
        return obj.total_balance

admin.site.register(Wallet, WalletAdmin)


@admin.register(Transaction)
class TransactionAdmin(ImportExportModelAdmin):
    list_display = (
        'id_short',
        'payment_method_badge',
        'from_wallet_info',
        'to_wallet_info',
        'amount_display',
        'status_badge',
        'timestamp',
        'actions_buttons',
    )
    list_filter = (
        'payment_method',
        'status',
        'is_payed',
        'has_online_payment',
        'timestamp',
    )
    search_fields = (
        'id',
        'from_wallet__user__mobile',
        'from_wallet__user__username',
        'to_wallet__user__mobile',
        'to_wallet__user__username',
    )
    readonly_fields = (
        'id',
        'from_wallet',
        'to_wallet',
        'withdrawable_amount',
        'gift_amount',
        'total_amount',
        'payment_method',
        'status',
        'timestamp',
        'has_online_payment',
        'is_payed',
    )
    fieldsets = (
        (_('Transaction information'), {
            'fields': ('id', 'payment_method', 'status', 'timestamp')
        }),
        (_('Amounts'), {
            'fields': ('withdrawable_amount', 'gift_amount', 'total_amount')
        }),
        (_('Wallets'), {
            'fields': ('from_wallet', 'to_wallet')
        }),
        (_('Payment state'), {
            'fields': ('has_online_payment', 'is_payed')
        }),
    )
    actions = ['approve_withdrawal_requests']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('from_wallet__user', 'to_wallet__user')
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = _('ID')
    
    def payment_method_badge(self, obj):
        colors = {
            'withdrawal': '#F44336',
            'deposit': '#4CAF50',
            'purchase': '#2196F3',
            'inner_transfer': '#FF9800',
        }
        labels = {
            'withdrawal': _('Withdrawal'),
            'deposit': _('Deposit'),
            'purchase': _('Purchase'),
            'inner_transfer': _('Internal transfer'),
        }
        color = colors.get(obj.payment_method, '#000')
        label = labels.get(obj.payment_method, obj.payment_method)
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color, label
        )
    payment_method_badge.short_description = _('Type')
    
    def from_wallet_info(self, obj):
        if obj.from_wallet:
            return f"{obj.from_wallet.user.mobile} ({obj.from_wallet.user.username})"
        return '-'
    from_wallet_info.short_description = _('From wallet')

    def to_wallet_info(self, obj):
        if obj.to_wallet:
            return f"{obj.to_wallet.user.mobile} ({obj.to_wallet.user.username})"
        return '-'
    to_wallet_info.short_description = _('To wallet')
    
    def amount_display(self, obj):
        parts = []
        if obj.withdrawable_amount > 0:
            parts.append(_("%(amount)s Toman") % {"amount": f"{obj.withdrawable_amount:,.0f}"})
        if obj.gift_amount > 0:
            parts.append(
                _("+ %(amount)s Toman gift") % {"amount": f"{obj.gift_amount:,.0f}"}
            )
        return format_html(
            '<div>{}</div><small style="color: #666;">{} {:,.0f} {}</small>',
            '<br>'.join(parts) if parts else '0',
            _('Total:'),
            obj.total_amount,
            _('Toman'),
        )
    amount_display.short_description = _('Amount')
    
    def status_badge(self, obj):
        colors = {
            'pending': '#FFA500',
            'completed': '#4CAF50',
            'failed': '#F44336',
            'canceled': '#9E9E9E',
        }
        labels = {
            'pending': _('Pending'),
            'completed': _('Completed'),
            'failed': _('Failed'),
            'canceled': _('Canceled'),
        }
        color = colors.get(obj.status, '#000')
        label = labels.get(obj.status, obj.status)
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px 10px; border-radius: 3px;">{}</span>',
            color, label
        )
    status_badge.short_description = _('Status')
    
    def actions_buttons(self, obj):
        if obj.payment_method == 'withdrawal' and obj.status == 'pending':
            return mark_safe(
                f'<span style="color: orange; font-weight: bold;">⏳ {_("Awaiting withdrawal approval")}</span>'
            )
        return '-'
    actions_buttons.short_description = _('Actions')
    
    def approve_withdrawal_requests(self, request, queryset):
        """Approve withdrawal requests."""
        updated = 0
        errors = []
        
        for transaction in queryset:
            if transaction.payment_method == 'withdrawal' and transaction.status == 'pending':
                try:
                    # Check available balance before completing transaction.
                    if transaction.from_wallet.withdrawable_balance >= transaction.withdrawable_amount:
                        transaction.complete()
                        updated += 1
                    else:
                        errors.append(
                            _('Transaction %(id)s: insufficient balance')
                            % {"id": str(transaction.id)[:8]}
                        )
                except Exception as e:
                    errors.append(
                        _('Transaction %(id)s: %(error)s')
                        % {"id": str(transaction.id)[:8], "error": str(e)}
                    )
        
        if updated:
            self.message_user(
                request,
                _('%(count)s withdrawal requests approved.') % {"count": updated},
            )
        if errors:
            self.message_user(request, ' | '.join(errors), level='error')
    approve_withdrawal_requests.short_description = _('Approve withdrawal requests')


class SystemAccountantAdmin(ImportExportModelAdmin):
    list_display = (
        'recorded_total_withdrawable',
        'recorded_total_gift',
        'recorded_total_blocked',
        'recorded_total_purchased',
        'recorded_total_inner_transfered',
        'recorded_total_deposit',
        'recorded_total_withdrawed',
        'recorded_total_to_withdraw',
        'recorded_total_gift_used',
    )
    readonly_fields = (
        'shadow_total_withdrawable',
        'shadow_total_gift',
        'shadow_total_blocked',
        'shadow_total_purchased',
        'shadow_total_inner_transfered',
        'shadow_total_deposit',
        'shadow_total_withdrawed',
        'shadow_total_to_withdraw',
        'shadow_total_gift_used',
    )
    def shadow_total_withdrawable(self, obj):
        return obj.shadow_total_withdrawable

    def shadow_total_gift(self, obj):
        return obj.shadow_total_gift

    def shadow_total_blocked(self, obj):
        return obj.shadow_total_blocked

    def shadow_total_purchased(self, obj):
        return obj.shadow_total_purchased

    def shadow_total_inner_transfered(self, obj):
        return obj.shadow_total_inner_transfered

    def shadow_total_deposit(self, obj):
        return obj.shadow_total_deposit

    def shadow_total_withdrawed(self, obj):
        return obj.shadow_total_withdrawed

    def shadow_total_to_withdraw(self, obj):
        return obj.shadow_total_to_withdraw

    def shadow_total_gift_used(self, obj):
        return obj.shadow_total_gift_used



admin.site.register(SystemAccountant, SystemAccountantAdmin)


@admin.register(WithdrawRequest)
class WithdrawRequestAdmin(ImportExportModelAdmin):
    list_display = (
        "id_short",
        "user_display",
        "amount_display",
        "bank_name",
        "account_holder",
        "status_display",
        "created_at",
    )
    list_filter = ("status",)
    search_fields = (
        "wallet__user__mobile",
        "wallet__user__username",
        "bank_name",
        "account_holder",
    )
    readonly_fields = (
        "id",
        "wallet",
        "amount",
        "status",
        "bank_sheba_or_card",
        "bank_name",
        "account_holder",
        "description",
        "rejection_reason",
        "rejected_at",
        "rejected_by",
        "deposit_reference_id",
        "deposited_at",
        "deposited_by",
        "transaction",
        "created_at",
        "updated_at",
    )

    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = _("ID")

    def user_display(self, obj):
        return obj.wallet.user.mobile or obj.wallet.user.username
    user_display.short_description = _("User")

    def amount_display(self, obj):
        return _("%(amount)s Toman") % {"amount": f"{obj.amount:,.0f}"}
    amount_display.short_description = _("Amount")

    def status_display(self, obj):
        labels = {
            "pending": _("Pending"),
            "approved": _("Approved"),
            "rejected": _("Rejected"),
            "deposited": _("Deposited"),
        }
        return labels.get(obj.status, obj.status)
    status_display.short_description = _("Status")
