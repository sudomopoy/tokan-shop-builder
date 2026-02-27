# backends.py
from django.contrib.auth.backends import ModelBackend
from .models import CustomUser


class StoreAuthBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, store=None, **kwargs):
        try:
            user = CustomUser.objects.get(username=username, store=store)
            if user.check_password(password):
                return user
        except CustomUser.DoesNotExist:
            return None
