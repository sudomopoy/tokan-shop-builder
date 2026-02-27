from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Article

@receiver(post_save, sender=Article)
def set_seo_configs(sender, instance, created, **kwargs):
    if created:
        instance.generate_seo_configs()