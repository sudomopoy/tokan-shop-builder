from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, Optional

from django.db.models import Q

from account.models import StoreUser
from product.models import (
    Product,
    Variant,
    ProductGroupPrice,
    ProductTierDiscount,
    StoreCartTierDiscount,
)


MONEY_QUANT = Decimal("0.01")


def to_decimal(value) -> Decimal:
    if isinstance(value, Decimal):
        return value
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


def money(value) -> Decimal:
    return to_decimal(value).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


@dataclass
class LinePricing:
    product: Product
    variant: Optional[Variant]
    quantity: int
    base_unit_price: Decimal
    unit_price: Decimal
    quantity_discount_percent: Decimal
    line_subtotal: Decimal
    line_total: Decimal
    line_discount_amount: Decimal
    applied_group_price_id: Optional[str] = None


@dataclass
class CartPricing:
    subtotal: Decimal
    total_quantity: int
    cart_discount_percent: Decimal
    cart_discount_amount: Decimal
    total: Decimal
    discount_rule_id: Optional[str] = None


def get_store_user_group_ids(store_user: Optional[StoreUser]) -> list:
    if not store_user:
        return []
    return list(
        store_user.group_memberships.filter(customer_group__is_active=True).values_list(
            "customer_group_id", flat=True
        )
    )


def product_is_accessible_to_store_user(
    product: Product, store_user: Optional[StoreUser]
) -> bool:
    allowed_qs = product.allowed_customer_groups.all()
    if not allowed_qs.exists():
        return True
    group_ids = get_store_user_group_ids(store_user)
    if not group_ids:
        return False
    return allowed_qs.filter(id__in=group_ids, is_active=True).exists()


def validate_purchase_quantity(
    product: Product, quantity: int, variant: Optional[Variant] = None
) -> None:
    if quantity is None or int(quantity) < 1:
        raise ValueError("Quantity must be at least 1.")

    if product.is_wholesale_mode and variant is not None:
        raise ValueError("Wholesale mode does not allow variant selection.")

    if product.min_order_quantity is not None and quantity < product.min_order_quantity:
        raise ValueError(
            f"Minimum allowed quantity for this product is {product.min_order_quantity}."
        )
    if product.max_order_quantity is not None and quantity > product.max_order_quantity:
        raise ValueError(
            f"Maximum allowed quantity for this product is {product.max_order_quantity}."
        )

    pack_size = max(1, product.pack_size or 1)
    min_pack_count = max(1, product.min_pack_count or 1)

    if quantity % pack_size != 0:
        raise ValueError(
            f"Quantity must be a multiple of pack size ({pack_size})."
        )
    if quantity < (pack_size * min_pack_count):
        raise ValueError(
            f"Minimum purchasable pack count is {min_pack_count} (at least {pack_size * min_pack_count} units)."
        )


def _default_prices(product: Product, variant: Optional[Variant]):
    if variant is not None:
        base_price = to_decimal(variant.price or product.price or 0)
        sell_price = to_decimal(variant.sell_price or variant.price or product.sell_price or product.price or 0)
    else:
        base_price = to_decimal(product.price or 0)
        sell_price = to_decimal(product.sell_price or product.price or 0)
    return base_price, sell_price


def resolve_group_specific_price(
    product: Product,
    store_user: Optional[StoreUser],
    variant: Optional[Variant] = None,
):
    base_price, sell_price = _default_prices(product, variant)
    group_ids = get_store_user_group_ids(store_user)
    if not group_ids:
        return base_price, sell_price, None

    rules = ProductGroupPrice.objects.filter(
        store=product.store,
        product=product,
        customer_group_id__in=group_ids,
        is_active=True,
    )
    if variant is not None:
        rules = rules.filter(Q(variant=variant) | Q(variant__isnull=True))
    else:
        rules = rules.filter(variant__isnull=True)

    rule = rules.order_by("sell_price", "-created_at").first()
    if not rule:
        return base_price, sell_price, None

    if rule.price is not None:
        base_price = to_decimal(rule.price)
    sell_price = to_decimal(rule.sell_price)
    return base_price, sell_price, rule


def resolve_product_quantity_discount(
    product: Product, quantity: int, group_ids: Optional[list] = None
):
    rules = ProductTierDiscount.objects.filter(
        store=product.store,
        product=product,
        is_active=True,
        min_quantity__lte=quantity,
    ).filter(Q(max_quantity__isnull=True) | Q(max_quantity__gte=quantity))

    if group_ids:
        rules = rules.filter(Q(customer_group__isnull=True) | Q(customer_group_id__in=group_ids))
    else:
        rules = rules.filter(customer_group__isnull=True)

    rule = rules.order_by("-discount_percent", "-min_quantity").first()
    if not rule:
        return Decimal("0"), None
    return to_decimal(rule.discount_percent), rule


def calculate_line_pricing(
    product: Product,
    quantity: int,
    store_user: Optional[StoreUser] = None,
    variant: Optional[Variant] = None,
) -> LinePricing:
    if not product_is_accessible_to_store_user(product, store_user):
        raise PermissionError("You do not have access to this product.")

    validate_purchase_quantity(product, quantity, variant)

    group_ids = get_store_user_group_ids(store_user)
    base_unit_price, pre_discount_unit_price, group_rule = resolve_group_specific_price(
        product=product,
        store_user=store_user,
        variant=variant,
    )
    quantity_discount_percent, _ = resolve_product_quantity_discount(
        product=product,
        quantity=quantity,
        group_ids=group_ids,
    )

    if quantity_discount_percent > 0:
        unit_price = money(
            pre_discount_unit_price
            * (Decimal("100") - quantity_discount_percent)
            / Decimal("100")
        )
    else:
        unit_price = money(pre_discount_unit_price)

    line_subtotal = money(pre_discount_unit_price * quantity)
    line_total = money(unit_price * quantity)
    line_discount_amount = money(line_subtotal - line_total)

    return LinePricing(
        product=product,
        variant=variant,
        quantity=quantity,
        base_unit_price=money(base_unit_price),
        unit_price=unit_price,
        quantity_discount_percent=quantity_discount_percent,
        line_subtotal=line_subtotal,
        line_total=line_total,
        line_discount_amount=line_discount_amount,
        applied_group_price_id=str(group_rule.id) if group_rule else None,
    )


def resolve_cart_discount_rule(
    store,
    subtotal: Decimal,
    total_quantity: int,
    group_ids: Optional[list] = None,
):
    rules = StoreCartTierDiscount.objects.filter(store=store, is_active=True)
    if group_ids:
        rules = rules.filter(Q(customer_group__isnull=True) | Q(customer_group_id__in=group_ids))
    else:
        rules = rules.filter(customer_group__isnull=True)

    candidates = []
    for rule in rules:
        if rule.criterion == StoreCartTierDiscount.CRITERION_AMOUNT:
            current_value = subtotal
        else:
            current_value = Decimal(total_quantity)

        if current_value < to_decimal(rule.min_value):
            continue
        if rule.max_value is not None and current_value > to_decimal(rule.max_value):
            continue
        candidates.append(rule)

    if not candidates:
        return None

    candidates.sort(
        key=lambda r: (to_decimal(r.discount_percent), to_decimal(r.min_value)),
        reverse=True,
    )
    return candidates[0]


def calculate_cart_pricing(
    store,
    lines: Iterable[LinePricing],
    store_user: Optional[StoreUser] = None,
) -> CartPricing:
    lines = list(lines)
    subtotal = money(sum((line.line_total for line in lines), Decimal("0")))
    total_quantity = int(sum(line.quantity for line in lines))
    group_ids = get_store_user_group_ids(store_user)
    rule = resolve_cart_discount_rule(
        store=store,
        subtotal=subtotal,
        total_quantity=total_quantity,
        group_ids=group_ids,
    )
    discount_percent = to_decimal(rule.discount_percent) if rule else Decimal("0")
    discount_amount = money(subtotal * discount_percent / Decimal("100"))
    total = money(subtotal - discount_amount)

    return CartPricing(
        subtotal=subtotal,
        total_quantity=total_quantity,
        cart_discount_percent=discount_percent,
        cart_discount_amount=discount_amount,
        total=total,
        discount_rule_id=str(rule.id) if rule else None,
    )
