from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Order, ShippingMethod, ShippingMethodDefinition, OrderItem
from import_export.admin import ImportExportModelAdmin


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'variant', 'quantity', 'unit_price', 'total_price')
    can_delete = False
    
    def total_price(self, obj):
        return obj.quantity * obj.unit_price
    total_price.short_description = 'مبلغ کل'


@admin.register(Order)
class OrderAdmin(ImportExportModelAdmin):
    list_display = (
        'code',
        'store_link',
        'customer_name',
        'payable_amount_display',
        'status_badge',
        'is_payed',
        'created_at',
        'actions_buttons',
    )
    list_filter = (
        'status',
        'is_payed',
        'is_completed',
        'is_delivered',
        'is_canceled',
        'store__is_shared_store',
        'created_at',
    )
    search_fields = (
        'code',
        'store_user__user__mobile',
        'store_user__display_name',
        'store__name',
        'store__title',
        'shipping_tracking_code',
    )
    readonly_fields = (
        'code',
        'created_at',
        'updated_at',
        'transaction',
        'store',
        'store_user',
        'products_total_amount',
        'delivery_amount',
        'payable_amount',
    )
    fieldsets = (
        ('اطلاعات سفارش', {
            'fields': ('code', 'store', 'store_user', 'status')
        }),
        ('مبالغ', {
            'fields': ('products_total_amount', 'delivery_amount', 'payable_amount')
        }),
        ('ارسال', {
            'fields': ('shipping_method', 'delivery_address', 'shipping_tracking_code')
        }),
        ('وضعیت‌ها', {
            'fields': ('is_payed', 'is_completed', 'is_delivered', 'is_canceled', 'is_failed')
        }),
        ('تراکنش', {
            'fields': ('transaction',)
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    inlines = [OrderItemInline]
    actions = [
        'mark_as_processing',
        'mark_as_delivered', 
        'mark_as_completed',
        'cancel_orders',
    ]
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # فقط سفارشات فروشگاه‌های اشتراکی را نشان بده
        return qs.filter(store__is_shared_store=True).select_related(
            'store', 'store_user', 'store_user__user', 'transaction'
        )
    
    def store_link(self, obj):
        url = reverse('admin:store_store_change', args=[obj.store.pk])
        return format_html('<a href="{}">{}</a>', url, obj.store.title)
    store_link.short_description = 'فروشگاه'
    
    def customer_name(self, obj):
        return f"{obj.store_user.display_name} ({obj.store_user.user.mobile})"
    customer_name.short_description = 'مشتری'
    
    def payable_amount_display(self, obj):
        return f"{obj.payable_amount:,.0f} تومان"
    payable_amount_display.short_description = 'مبلغ قابل پرداخت'
    
    def status_badge(self, obj):
        colors = {
            'pending': '#FFA500',
            'paid': '#4CAF50',
            'processing': '#2196F3',
            'completed': '#8BC34A',
            'delivered': '#00BCD4',
            'cancelled': '#F44336',
            'failed': '#9E9E9E',
        }
        labels = {
            'pending': 'در انتظار پرداخت',
            'paid': 'پرداخت شده',
            'processing': 'در حال پردازش',
            'completed': 'تکمیل شده',
            'delivered': 'ارسال شده',
            'cancelled': 'لغو شده',
            'failed': 'ناموفق',
        }
        color = colors.get(obj.status, '#000')
        label = labels.get(obj.status, obj.status)
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px 10px; border-radius: 3px;">{}</span>',
            color, label
        )
    status_badge.short_description = 'وضعیت'
    
    def actions_buttons(self, obj):
        buttons = []
        
        if obj.status == 'paid':
            buttons.append(
                f'<a class="button" href="#" onclick="return confirm(\'آیا مطمئن هستید؟\')">تایید</a>'
            )
        
        if obj.status == 'delivered':
            buttons.append(
                '<span style="color: orange;">⏳ منتظر تایید تسویه</span>'
            )
        
        if obj.status in ['paid', 'processing'] and not obj.is_canceled:
            buttons.append(
                '<a class="button" style="background-color: #F44336;" href="#">لغو</a>'
            )
        
        return mark_safe(' '.join(buttons)) if buttons else '-'
    actions_buttons.short_description = 'عملیات'
    
    # Actions
    def mark_as_processing(self, request, queryset):
        """تایید سفارش توسط فروشگاه"""
        updated = 0
        for order in queryset:
            if order.status == 'paid':
                order.status = 'processing'
                order.save()
                updated += 1
        
        self.message_user(request, f'{updated} سفارش به حالت "در حال پردازش" تغییر یافت.')
    mark_as_processing.short_description = 'تایید سفارش (تغییر به در حال پردازش)'
    
    def mark_as_delivered(self, request, queryset):
        """ثبت ارسال توسط فروشگاه"""
        updated = 0
        errors = []
        for order in queryset:
            if order.status == 'processing':
                if not order.shipping_tracking_code:
                    errors.append(f'سفارش {order.code}: کد رهگیری وارد نشده است.')
                else:
                    order.status = 'delivered'
                    order.save()
                    updated += 1
        
        if updated:
            self.message_user(request, f'{updated} سفارش به حالت "ارسال شده" تغییر یافت.')
        if errors:
            self.message_user(request, ' | '.join(errors), level='error')
    mark_as_delivered.short_description = 'ثبت ارسال (تغییر به ارسال شده)'
    
    def mark_as_completed(self, request, queryset):
        """تایید تسویه حساب توسط ادمین super_store"""
        updated = 0
        errors = []
        for order in queryset:
            if order.status == 'delivered':
                try:
                    order.status = 'completed'
                    order.save()  # تسویه حساب در save انجام می‌شود
                    updated += 1
                except Exception as e:
                    errors.append(f'سفارش {order.code}: {str(e)}')
        
        if updated:
            self.message_user(request, f'{updated} سفارش تسویه حساب شد.')
        if errors:
            self.message_user(request, ' | '.join(errors), level='error')
    mark_as_completed.short_description = 'تایید و تسویه حساب'
    
    def cancel_orders(self, request, queryset):
        """لغو سفارشات"""
        updated = 0
        errors = []
        for order in queryset:
            try:
                order.cancel_order()
                updated += 1
            except Exception as e:
                errors.append(f'سفارش {order.code}: {str(e)}')
        
        if updated:
            self.message_user(request, f'{updated} سفارش لغو شد و وجه بازگشت داده شد.')
        if errors:
            self.message_user(request, ' | '.join(errors), level='error')
    cancel_orders.short_description = 'لغو سفارش و بازگشت وجه'


@admin.register(ShippingMethodDefinition)
class ShippingMethodDefinitionAdmin(ImportExportModelAdmin):
    list_display = ("slug", "name", "default_base_shipping_price")
    search_fields = ("slug", "name")


@admin.register(ShippingMethod)
class ShippingMethodAdmin(ImportExportModelAdmin):
    list_display = (
        "name",
        "store",
        "definition",
        "is_active",
        "base_shipping_price",
        "shipping_payment_on_delivery",
        "product_payment_on_delivery",
    )
    list_filter = ("is_active", "shipping_payment_on_delivery", "product_payment_on_delivery", "store", "definition")
    list_editable = ("is_active",)
    search_fields = ("name", "description")
