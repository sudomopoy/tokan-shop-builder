from django.db import models
from core.abstract_models import BaseStoreModel
from product.models import Product, Variant


class Basket(BaseStoreModel):
    """
    سد خرید کاربر (پیش از تبدیل شدن به سفارش)
    """
    store_user = models.ForeignKey(
        "account.StoreUser",
        on_delete=models.CASCADE,
        related_name="baskets"
    )
    # هر کاربر در هر فروشگاه فقط یک سبد فعال دارد
    # (می‌توان با یک constraint unique روی (store, store_user) این را تضمین کرد)
    
    class Meta:
        unique_together = ["store", "store_user"]
        verbose_name = "Basket"
        verbose_name_plural = "Baskets"

    def __str__(self):
        return f"Basket for {self.store_user} in {self.store}"

    @property
    def total_price(self):
        return sum(item.total_price for item in self.items.all())

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())


class BasketItem(BaseStoreModel):
    basket = models.ForeignKey(
        Basket,
        on_delete=models.CASCADE,
        related_name="items"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE
    )
    variant = models.ForeignKey(
        Variant,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ["basket", "product", "variant"]
        verbose_name = "Basket Item"
        verbose_name_plural = "Basket Items"

    def __str__(self):
        return f"{self.quantity}x {self.product.title}"

    @property
    def unit_price(self):
        if self.variant:
            return self.variant.sell_price or self.variant.price
        return self.product.sell_price or self.product.price

    @property
    def total_price(self):
        return self.unit_price * self.quantity
