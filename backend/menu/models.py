from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Max, Q
from core.abstract_models import BaseStoreModel


class Menu(BaseStoreModel):
    title = models.CharField(max_length=200)
    key = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Unique key for fetching menu (e.g. header, footer).",
    )
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_primary = models.BooleanField(
        default=False,
        help_text="Only one primary menu is allowed per store.",
    )

    class Meta:
        ordering = ["title"]
        constraints = [
            models.UniqueConstraint(
                fields=["store", "key"],
                condition=Q(key__isnull=False) & ~Q(key=""),
                name="unique_menu_key_per_store",
            ),
            models.UniqueConstraint(
                fields=["store"],
                condition=Q(is_primary=True),
                name="unique_primary_menu_per_store",
            ),
        ]

    def __str__(self):
        return f"{self.store.name} - {self.title}"

    def save(self, *args, **kwargs):
        if self.is_primary and self.store_id:
            Menu.objects.filter(store_id=self.store_id, is_primary=True).exclude(
                pk=self.pk
            ).update(is_primary=False)
        super().save(*args, **kwargs)


class MenuItem(BaseStoreModel):
    class ItemType(models.TextChoices):
        LINK = "link", "Link"
        EMPTY = "empty", "Empty"
        CATEGORY = "category", "Category"
        PRODUCT = "product", "Product"
        PAGE = "page", "Page"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        COMING_SOON = "coming_soon", "Coming Soon"

    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name="items")
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE, related_name="children"
    )
    title = models.CharField(max_length=200, null=True, blank=True)
    item_type = models.CharField(max_length=20, choices=ItemType.choices)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    url = models.CharField(max_length=1000, null=True, blank=True)
    category = models.ForeignKey(
        "category.Category",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="menu_items",
    )
    product = models.ForeignKey(
        "product.Product",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="menu_items",
    )
    page = models.ForeignKey(
        "page.Page",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="menu_items",
    )
    index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["menu", "parent_id", "index"]
        constraints = [
            models.UniqueConstraint(
                fields=["menu", "parent", "index"],
                name="unique_menu_item_index_per_parent",
            )
        ]

    def __str__(self):
        return f"{self.menu.title} - {self.title or self.get_item_type_display()}"

    def save(self, *args, **kwargs):
        if self.menu_id and not self.store_id:
            self.store = self.menu.store

        if self.menu_id and self.store_id and self.menu.store_id != self.store_id:
            raise ValidationError({"store": "Menu item store must match menu store."})

        if self.parent_id and self.menu_id and self.parent.menu_id != self.menu_id:
            raise ValidationError({"parent": "Parent item must belong to the same menu."})

        if self.pk is None and self.index == 0:
            max_index = (
                MenuItem.objects.filter(menu=self.menu, parent=self.parent).aggregate(
                    Max("index")
                )["index__max"]
            )
            self.index = (max_index or -1) + 1

        super().save(*args, **kwargs)
