from rest_framework import serializers
from .models import Menu, MenuItem


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    product_title = serializers.CharField(source="product.title", read_only=True)
    page_path = serializers.CharField(source="page.path", read_only=True)
    resolved_title = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "store",
            "menu",
            "parent",
            "title",
            "resolved_title",
            "item_type",
            "status",
            "url",
            "category",
            "product",
            "page",
            "category_name",
            "product_title",
            "page_path",
            "index",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {"store": {"read_only": True}}

    def get_resolved_title(self, obj):
        if obj.title:
            return obj.title
        if obj.item_type == MenuItem.ItemType.CATEGORY and obj.category:
            return obj.category.name
        if obj.item_type == MenuItem.ItemType.PRODUCT and obj.product:
            return obj.product.title
        if obj.item_type == MenuItem.ItemType.PAGE and obj.page:
            return obj.page.title or obj.page.path
        return ""

    def validate(self, data):
        item_type = data.get("item_type", getattr(self.instance, "item_type", None))
        menu = data.get("menu", getattr(self.instance, "menu", None))
        parent = data.get("parent", getattr(self.instance, "parent", None))
        url = data.get("url", getattr(self.instance, "url", None))
        category = data.get("category", getattr(self.instance, "category", None))
        product = data.get("product", getattr(self.instance, "product", None))
        page = data.get("page", getattr(self.instance, "page", None))

        errors = {}

        if parent and menu and parent.menu_id != menu.id:
            errors["parent"] = "Parent item must belong to the same menu."

        request = self.context.get("request")
        store = menu.store if menu else getattr(self.instance, "store", None)
        if request and hasattr(request, "store") and menu and menu.store_id != request.store.id:
            errors["menu"] = "Menu must belong to the current store."

        if store:
            if category and category.store_id != store.id:
                errors["category"] = "Category must belong to the same store."
            if product and product.store_id != store.id:
                errors["product"] = "Product must belong to the same store."
            if page and page.store_id != store.id:
                errors["page"] = "Page must belong to the same store."

        if item_type == MenuItem.ItemType.LINK:
            if not url:
                errors["url"] = "url is required for link items."
            if category or product or page:
                errors["target"] = "Link items cannot reference category/product/page."
        elif item_type == MenuItem.ItemType.CATEGORY:
            if not category:
                errors["category"] = "category is required for category items."
            if url or product or page:
                errors["target"] = "Category items cannot include other targets."
        elif item_type == MenuItem.ItemType.PRODUCT:
            if not product:
                errors["product"] = "product is required for product items."
            if url or category or page:
                errors["target"] = "Product items cannot include other targets."
        elif item_type == MenuItem.ItemType.PAGE:
            if not page:
                errors["page"] = "page is required for page items."
            if url or category or product:
                errors["target"] = "Page items cannot include other targets."
        elif item_type == MenuItem.ItemType.EMPTY:
            if url or category or product or page:
                errors["target"] = "Empty items cannot include targets."

        if errors:
            raise serializers.ValidationError(errors)

        return data


class MenuItemTreeSerializer(MenuItemSerializer):
    children = serializers.SerializerMethodField()

    class Meta(MenuItemSerializer.Meta):
        fields = MenuItemSerializer.Meta.fields + ["children"]

    def get_children(self, obj):
        children = obj.children.all().order_by("index")
        return MenuItemTreeSerializer(children, many=True, context=self.context).data


class MenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = Menu
        fields = [
            "id",
            "store",
            "title",
            "key",
            "description",
            "is_active",
            "is_primary",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {"store": {"read_only": True}}


class MenuDetailSerializer(MenuSerializer):
    items = serializers.SerializerMethodField()

    class Meta(MenuSerializer.Meta):
        fields = MenuSerializer.Meta.fields + ["items"]

    def get_items(self, obj):
        roots = obj.items.filter(parent__isnull=True).order_by("index")
        return MenuItemTreeSerializer(roots, many=True, context=self.context).data
