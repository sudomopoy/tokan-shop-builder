from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from account.serializers import (
    AccountInfoSerializer,
    AddressSerializer,
    StoreUserSerializer,
    StoreUserListSerializer,
    StoreAdminPermissionSerializer,
    MakeAdminSerializer,
)
from account.models import User, Address, StoreUser, StoreAdminPermission
from core.permissions import IsStoreCustomer, IsStoreOwner, IsStoreOwnerOnly, HasUsersReadOrOwner
from core.permissions import StoreFilterMixin
from account.admin_utils import get_store_max_admins, get_store_active_admin_count


class StoreLoginView:
    pass  # placeholder - actual view imported below if needed


from .forms import StoreLoginForm
from django.contrib.auth.views import LoginView


class StoreLoginView(LoginView):
    form_class = StoreLoginForm
    template_name = "admin1/store_login.html"

    def form_valid(self, form):
        store = form.cleaned_data.get("store")
        username = form.cleaned_data.get("username")
        user = form.get_user()
        if user.store != store:
            form.add_error(None, "کاربری با این یوزرنیم و فروشگاه وجود ندارد")
            return self.form_invalid(form)
        return super().form_valid(form)


class AccountViewSet(viewsets.GenericViewSet):
    serializer_class = AccountInfoSerializer
    permission_classes = [IsStoreCustomer]

    @action(detail=False, methods=["get"])
    def info(self, request, *args, **kwargs):
        user = User.objects.get(mobile=request.user.mobile)
        serialized = self.get_serializer(user, many=False, context={"request": request})
        return Response(data=serialized.data)

    @action(detail=False, methods=["post"])
    def verify(self, request, *args, **kwargs):
        user = User.objects.get(mobile=request.user.mobile)
        if user.is_verified:
            return Response({"detail": "احراز هویت شما تایید شده است."})
        serialized = self.get_serializer(user, many=False, context={"request": request})
        return Response(data=serialized.data)


class AddressViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    StoreFilterMixin,
):
    serializer_class = AddressSerializer
    permission_classes = [IsStoreCustomer]

    def get_queryset(self):
        return Address.objects.filter(store_user=self.request.store_user).order_by("-id")

    def perform_create(self, serializer):
        serializer.save(store_user=self.request.store_user)

    def perform_update(self, serializer):
        serializer.save(store_user=self.request.store_user)


class StoreUserViewSet(viewsets.ReadOnlyModelViewSet, StoreFilterMixin):
    """لیست و مدیریت کاربران فروشگاه. فقط owner می‌تواند مسدود/ادمین کند."""
    queryset = StoreUser.objects.select_related("user").prefetch_related("admin_permissions").order_by("-register_at")
    permission_classes = [HasUsersReadOrOwner]

    def get_queryset(self):
        """فقط StoreUserهای مربوط به فروشگاه فعلی."""
        qs = super().get_queryset()
        store = getattr(self.request, "store", None)
        if not store:
            return qs.none()
        return qs.filter(store=store)

    def get_permissions(self):
        if self.action in ("block", "unblock", "make_admin", "remove_admin"):
            return [IsStoreOwnerOnly()]
        return [HasUsersReadOrOwner()]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return StoreUserSerializer
        return StoreUserListSerializer

    @action(detail=True, methods=["post"], permission_classes=[IsStoreOwnerOnly])
    def block(self, request, pk=None):
        """مسدود کردن کاربر در فروشگاه."""
        store_user = self.get_object()
        if store_user.store.owner_id == store_user.user_id:
            return Response(
                {"detail": "نمی‌توانید مالک فروشگاه را مسدود کنید."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        store_user.is_blocked = True
        store_user.save(update_fields=["is_blocked", "updated_at"])
        return Response({"detail": "کاربر مسدود شد."})

    @action(detail=True, methods=["post"], permission_classes=[IsStoreOwnerOnly])
    def unblock(self, request, pk=None):
        """رفع مسدودیت کاربر در فروشگاه."""
        store_user = self.get_object()
        store_user.is_blocked = False
        store_user.save(update_fields=["is_blocked", "updated_at"])
        return Response({"detail": "مسدودیت کاربر رفع شد."})

    @action(detail=True, methods=["post"], permission_classes=[IsStoreOwnerOnly])
    def make_admin(self, request, pk=None):
        """تبدیل کاربر به ادمین با دسترسی‌های مشخص."""
        store_user = self.get_object()
        store = request.store

        if store_user.store.owner_id == store_user.user_id:
            return Response(
                {"detail": "مالک فروشگاه از قبل دسترسی کامل دارد."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_admins = get_store_max_admins(store)
        if max_admins == 0:
            return Response(
                {"detail": "پلن فعلی امکان تعریف ادمین ندارد."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        active_count = get_store_active_admin_count(store)
        if store_user.is_admin and store_user.is_admin_active:
            active_count -= 1
        if active_count >= max_admins and not (store_user.is_admin and store_user.is_admin_active):
            return Response(
                {"detail": f"حداکثر تعداد ادمین مجاز در پلن شما {max_admins} نفر است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ser = MakeAdminSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        perms_data = ser.validated_data["permissions"]

        store_user.level = 1
        store_user.is_admin = True
        store_user.is_admin_active = True
        store_user.save(update_fields=["level", "is_admin", "is_admin_active", "updated_at"])

        perm, _ = StoreAdminPermission.objects.get_or_create(store_user=store_user)
        for k, v in perms_data.items():
            setattr(perm, k, v)
        perm.save()

        return Response(StoreUserSerializer(store_user).data)

    @action(detail=True, methods=["post"], permission_classes=[IsStoreOwnerOnly])
    def remove_admin(self, request, pk=None):
        """حذف ادمین و بازگرداندن به مشتری."""
        store_user = self.get_object()
        if store_user.store.owner_id == store_user.user_id:
            return Response(
                {"detail": "نمی‌توانید مالک فروشگاه را از ادمینی حذف کنید."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        store_user.level = 0
        store_user.is_admin = False
        store_user.is_admin_active = True
        store_user.save(update_fields=["level", "is_admin", "is_admin_active", "updated_at"])
        StoreAdminPermission.objects.filter(store_user=store_user).delete()
        return Response({"detail": "کاربر از ادمینی حذف شد."})

    @action(detail=False, methods=["get"])
    def plan_info(self, request):
        """اطلاعات محدودیت پلن برای ادمین (حداکثر ادمین و ...)."""
        store = request.store
        max_admins = get_store_max_admins(store)
        active_count = get_store_active_admin_count(store)
        from core.permissions import is_store_owner
        return Response({
            "max_admins": max_admins,
            "active_admin_count": active_count,
            "can_add_admin": max_admins > 0 and active_count < max_admins,
            "is_owner": is_store_owner(request),
        })


from rest_framework import viewsets
from .models import BankAccount
from .serializers import BankAccountSerializer


class BankAccountViewSet(viewsets.ModelViewSet):
    serializer_class = BankAccountSerializer
    permission_classes = [IsStoreCustomer]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return BankAccount.objects.all()
        return BankAccount.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if not self.request.user.is_superuser and "status" in serializer.validated_data:
            serializer.validated_data.pop("status")
        serializer.save()

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        if not request.user.is_superuser:
            return Response({"detail": "شما اجازه این عملیات را ندارید."}, status=403)
        account = self.get_object()
        account.status = "approved"
        account.save()
        account.send_status_sms()
        return Response({"status": "approved"})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        if not request.user.is_superuser:
            return Response({"detail": "شما اجازه این عملیات را ندارید."}, status=403)
        account = self.get_object()
        account.status = "rejected"
        account.save()
        account.send_status_sms()
        return Response({"status": "rejected"})
