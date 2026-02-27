import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from store.models import Store
from product.models import VariantAttribute, VariantAttributeValue

colors = [
{"title": "آبی فیروزهای", "code": "#40E0D0"},
{"title": "سبز زمردی", "code": "#50C878"},
{"title": "زرد طلایی", "code": "#FFD700"},
{"title": "نقرهای", "code": "#C0C0C0"},
{"title": "آبی کبود", "code": "#4682B4"},
{"title": "سبز زیتونی", "code": "#808000"},
{"title": "بژ", "code": "#F5F5DC"},
{"title": "آبی آسمانی", "code": "#87CEEB"},
{"title": "خاکی", "code": "#F0E68C"},
{"title": "قرمز گیلاسی", "code": "#DE3163"},
{"title": "سبز جنگلی", "code": "#228B22"},
{"title": "آبی دریایی", "code": "#000080"},
{"title": "طوسی تیره", "code": "#A9A9A9"},
{"title": "صورتی چرک", "code": "#D87093"},
{"title": "بنفش یاسی", "code": "#C8A2C8"},
{"title": "قهوهای شکلاتی", "code": "#D2691E"},
{"title": "آبی کاربنی", "code": "#0047AB"},
{"title": "سبز لیمویی", "code": "#32CD32"},
{"title": "زرد لیمویی", "code": "#FFFACD"},
{"title": "قرمز آجری", "code": "#B22222"},
{"title": "مشکی", "code": "#000000"},
{"title": "سفید", "code": "#FFFFFF"},
{"title": "قرمز", "code": "#FF0000"},
{"title": "آبی", "code": "#0000FF"},
{"title": "سبز", "code": "#008000"},
{"title": "زرد", "code": "#FFFF00"},
{"title": "نارنجی", "code": "#FFA500"},
{"title": "صورتی", "code": "#FFC0CB"},
{"title": "بنفش", "code": "#800080"},
{"title": "طوسی", "code": "#808080"},
{"title": "قهوهای", "code": "#A52A2A"},
{"title": "آبی نفتی", "code": "#2F4F4F"},
{"title": "زرشکی", "code": "#800000"},
{"title": "آبی روشن", "code": "#ADD8E6"},
{"title": "سبز نعنایی", "code": "#98FF98"},
]

for store in Store.objects.all():
    color_attr, _ = VariantAttribute.objects.get_or_create(
        store=store,
        slug="color",
        defaults={"title": "رنگ", "display_type": "color", "unit": "", "is_system": True},
    )
    for c in colors:
        VariantAttributeValue.objects.get_or_create(
            store=store,
            attribute=color_attr,
            title=c["title"],
            defaults={"code": c["code"]},
        )

print("Color values added successfully for all stores!")