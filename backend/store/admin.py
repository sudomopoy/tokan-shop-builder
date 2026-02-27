from django import forms
from django.contrib import admin
from django.utils import timezone
from .models import Store, Plan, SettingDefinition, StoreSetting, StoreCategory, SystemConfig, SmartSetupRequest, SmartSetupPayment, DomainChangeRequest
from import_export.admin import ImportExportModelAdmin

ModelAdmin = admin.ModelAdmin


class StoreCategoryAdminForm(forms.ModelForm):
    """فرم با dropdown برای نوع فروشگاه (slug)"""
    slug = forms.ChoiceField(
        label="نوع فروشگاه",
        choices=StoreCategory.SLUG_CHOICES,
        required=False,
        widget=forms.Select(attrs={"class": "vTextField"}),
    )

    class Meta:
        model = StoreCategory
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk and self.instance.slug:
            if self.instance.slug not in [c[0] for c in StoreCategory.SLUG_CHOICES if c[0]]:
                self.fields["slug"].choices = list(StoreCategory.SLUG_CHOICES) + [(self.instance.slug, f"سایر: {self.instance.slug}")]

    def save(self, commit=True):
        instance = super().save(commit=False)
        slug = self.cleaned_data.get("slug") or ""
        if slug and slug in StoreCategory.CAPABILITIES_BY_SLUG:
            instance.capabilities = StoreCategory.CAPABILITIES_BY_SLUG[slug].copy()
        if slug:
            instance.slug = slug
        else:
            instance.slug = None
        if commit:
            instance.save()
        return instance

@admin.register(Store)
class StoreAdmin(ImportExportModelAdmin):
    pass


@admin.register(Plan)
class PlanAdmin( ImportExportModelAdmin):
    pass


@admin.register(SettingDefinition)
class SettingDefinitionAdmin( ImportExportModelAdmin):
    pass


@admin.register(StoreSetting)
class StoreSettingAdmin( ImportExportModelAdmin):
    pass


@admin.register(StoreCategory)
class StoreCategoryAdmin(ImportExportModelAdmin):
    form = StoreCategoryAdminForm
    list_display = ["title", "slug", "index", "created_at"]
    list_editable = ["index"]
    list_filter = ["slug"]
    search_fields = ["title"]
    ordering = ["index", "title"]


@admin.register(SystemConfig)
class SystemConfigAdmin(ModelAdmin):
    list_display = ["key", "value", "description"]
    search_fields = ["key"]


@admin.register(SmartSetupRequest)
class SmartSetupRequestAdmin(ModelAdmin):
    list_display = ["store", "status", "current_stage", "cost_amount", "created_at", "completed_at"]
    list_filter = ["status"]
    list_editable = ["status", "current_stage"]
    readonly_fields = ["created_at"]
    search_fields = ["store__name", "store__title"]

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if change and obj.status == SmartSetupRequest.STATUS_DONE and not obj.completed_at:
            from django.utils import timezone
            obj.completed_at = timezone.now()
            obj.save(update_fields=["completed_at"])


@admin.register(SmartSetupPayment)
class SmartSetupPaymentAdmin(ModelAdmin):
    list_display = ["smart_setup_request", "payment", "created_at"]
    readonly_fields = ["created_at"]


@admin.register(DomainChangeRequest)
class DomainChangeRequestAdmin(ModelAdmin):
    list_display = ["store", "requested_domain", "status", "created_at", "reviewed_at"]
    list_filter = ["status"]
    readonly_fields = ["created_at", "reviewed_at"]
    search_fields = ["store__name", "store__title", "requested_domain"]
    actions = ["approve_requests", "reject_requests"]

    @admin.action(description="تایید درخواست‌های انتخاب‌شده")
    def approve_requests(self, request, queryset):
        pending = queryset.filter(status=DomainChangeRequest.STATUS_PENDING)
        for req in pending:
            req.status = DomainChangeRequest.STATUS_APPROVED
            req.reviewed_at = timezone.now()
            req.reviewed_by = request.user
            req.save()
            req.store.external_domain = req.requested_domain
            req.store.is_shared_store = False
            req.store.save()
        self.message_user(request, f"{pending.count()} درخواست تایید و دامنه ثبت شد.")

    @admin.action(description="رد درخواست‌های انتخاب‌شده")
    def reject_requests(self, request, queryset):
        pending = queryset.filter(status=DomainChangeRequest.STATUS_PENDING)
        for req in pending:
            req.status = DomainChangeRequest.STATUS_REJECTED
            req.reviewed_at = timezone.now()
            req.reviewed_by = request.user
            req.save()
        self.message_user(request, f"{pending.count()} درخواست رد شد.")
