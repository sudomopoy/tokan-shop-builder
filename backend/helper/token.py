from django.conf import settings
from store.models import Store  
import jwt_auth
from datetime import datetime, timedelta

general_secret:str = settings.SECRET_KEY


def _get_jwt_token_secret(store:Store):
    store_secret = store._jwt_secret
    return general_secret.replace("%store_token%", store_secret)



def generate_store_jwt(user, store):
    payload = {
        "user_id": user.id,
        "store_id": str(store.id),
        "exp": datetime.now() + timedelta(days=30),
    }
    token = jwt_auth.encode(payload, _get_jwt_token_secret(store), algorithm="HS256")
    return token



def decode_store_jwt(token):
    unverified_payload = jwt_auth.decode(token, options={"verify_signature": False})
    store_id = unverified_payload.get("store_id")
    store = Store.objects.get(id=store_id)

    payload = jwt_auth.decode(token, _get_jwt_token_secret(store), algorithms=["HS256"])
    return store, payload
