import json
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from product.models import Product
from media.models import Media
from category.models import Category

with open('./product.json', 'r') as file:
    products = json.load(file) 

Product.objects.all().update(is_active=True)


# Product.objects.bulk_create([
#     Product(
#         id=product['id'],
#         title=product['title'],
#         short_description=product['short_description'],
#         description=product['description'],
#         code=int(product['code']),
#         stock=int(product['stock']),
#         soled=int(product['soled']),
#         price=float(product['price']),
#         sell_price=float(product['after_discount_price']),
#         category=Category.objects.get(pk='eb7a5564-c208-4a36-aeb7-cec107d7cede'),
#         main_image=Media.objects.get(pk=product['main_image_id']),
#     )
#     for product in products
# ])
