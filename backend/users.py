import json
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from account.models import User

with open('./users.json', 'r') as file:
    users = json.load(file) 


User.objects.bulk_create([
    User(
        username=user['phone_number'],
        mobile=user['phone_number'],
        display_name=user['display_name'],
        entry_source='Torob',
        register_at=user['created_at'],
        last_login=user['updated_at'],
        national_id=''
    )
    for user in users
])
