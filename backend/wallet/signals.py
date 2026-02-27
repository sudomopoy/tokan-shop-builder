# myapp/signals.py
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import SystemAccountant 

@receiver(post_migrate)
def create_initial_SystemAccountant_instance(sender, app_config, **kwargs):
    if app_config.label == 'wallet': 
        if not SystemAccountant.objects.exists():
            SystemAccountant.objects.create() 