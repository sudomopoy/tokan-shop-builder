# Migration: اگر super_store وجود نداشت یکی بساز، برای همه فروشگاه‌ها ست کن، و تضمین کن فقط یکی باشد

import uuid
import secrets
from django.db import migrations, connection


def ensure_super_store(apps, schema_editor):
    try:
        _run_ensure_super_store(apps)
    except Exception as e:
        raise RuntimeError(f"خطا در ensure_super_store: {e!r}") from e


def _run_ensure_super_store(apps):
    Store = apps.get_model("store", "Store")
    User = apps.get_model("account", "User")
    Plan = apps.get_model("store", "Plan")
    StoreUser = apps.get_model("account", "StoreUser")
    SettingDefinition = apps.get_model("store", "SettingDefinition")
    StoreSetting = apps.get_model("store", "StoreSetting")

    # ۱. فقط یک super_store در سیستم
    super_stores = list(Store.objects.filter(_is_super_store=True).order_by("id"))
    if len(super_stores) > 1:
        # همه جز اولی را عادی کن
        first = super_stores[0]
        for s in super_stores[1:]:
            Store.objects.filter(pk=s.pk).update(_is_super_store=False, super_store_id=first.pk)
        super_store = first
    elif super_stores:
        super_store = super_stores[0]
    else:
        # ۲. super_store وجود ندارد — بساز
        # (از raw SQL استفاده می‌شود چون ستون theme_slug در schema هست ولی در historical model نیست)
        owner = User.objects.filter(is_superuser=True).first()
        if not owner:
            owner = User.objects.first()
            if owner:
                User.objects.filter(pk=owner.pk).update(is_superuser=True)

        if not owner:
            # وقتی کاربری نیست super_store ساخته نمی‌شود؛ بعداً با migrate مجدد انجام می‌شود
            return

        plan = Plan.objects.filter(is_default=True).first() or Plan.objects.first()
        plan_id = plan.id if plan else None

        super_store_id = str(uuid.uuid4()).replace("-", "")[:32]
        jwt_secret = secrets.token_urlsafe(32)[:128]

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO store_store (
                    id, title, en_title, description, slogan, _is_super_store, _jwt_secret,
                    is_active, is_new, name, is_banned, is_shared_store, is_multi_vendor,
                    gift_percentage, has_gift, theme_slug, owner_id, plan_id, super_store_id
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                """,
                [
                    super_store_id,
                    "فروشگاه پلتفرم",
                    "Platform Store",
                    "",
                    "",
                    True,
                    jwt_secret,
                    True,
                    True,
                    "platform",
                    False,
                    False,
                    False,
                    "0.10",
                    False,
                    "default",
                    str(owner.pk).replace("-", "")[:32],
                    str(plan_id).replace("-", "")[:32] if plan_id else None,
                    super_store_id,
                ],
            )

        Store.objects.filter(pk=super_store_id).update(super_store_id=super_store_id)
        super_store = Store.objects.get(pk=super_store_id)

        # StoreUser برای مالک
        StoreUser.objects.get_or_create(
            store=super_store,
            user=owner,
            defaults={"level": 2, "entry_source": "migration", "is_admin": True, "is_vendor": True},
        )
        # StoreSetting‌های پیش‌فرض
        for defn in SettingDefinition.objects.all():
            StoreSetting.objects.get_or_create(
                store=super_store,
                definition=defn,
                defaults={"value": defn.default_value or ""},
            )
        # PaymentGateway از signal - اگر PaymentGatewayType وجود داشته باشد
        try:
            PaymentGatewayType = apps.get_model("payment", "PaymentGatewayType")
            PaymentGateway = apps.get_model("payment", "PaymentGateway")
            for gt in PaymentGatewayType.objects.all():
                PaymentGateway.objects.get_or_create(
                    store=super_store,
                    gateway_type=gt,
                    defaults={"title": gt.title, "configuration": {}, "is_sandbox": False},
                )
        except LookupError:
            pass

    # ۳. همه فروشگاه‌های دیگر super_store را روی این یکی ست کن
    Store.objects.exclude(pk=super_store.pk).update(super_store_id=super_store.pk)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("store", "0027_store_subscription_fields"),
    ]

    operations = [
        migrations.RunPython(ensure_super_store, noop, atomic=False),
    ]
