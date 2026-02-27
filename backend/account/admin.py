from django.contrib import admin
from .models import User, StoreUser, StoreAdminPermission, Address
from import_export.admin import ImportExportModelAdmin
from unfold.admin import ModelAdmin


@admin.register(User)
class UserAdmin( ImportExportModelAdmin):
    search_fields = ["mobile"]
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            return qs.filter(store=request.user.store)
        return qs


@admin.register(StoreUser)
class StoreUserAdmin(ImportExportModelAdmin):
    list_display = ["user", "store", "level", "is_admin", "is_admin_active", "is_blocked"]
    list_filter = ["level", "is_admin", "is_admin_active", "is_blocked"]


@admin.register(StoreAdminPermission)
class StoreAdminPermissionAdmin(admin.ModelAdmin):
    list_display = ["store_user", "products_read", "users_read", "orders_read", "blog_read", "reservation_read", "media_delete"]


@admin.register(Address)
class AddressAdmin( ImportExportModelAdmin):
    pass


