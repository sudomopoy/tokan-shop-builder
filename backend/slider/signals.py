from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from slider.models import Slide 
from django.db.models import Max, F

@receiver(post_delete, sender=Slide)
def update_indexes_on_delete(sender, instance, **kwargs):
    slides = Slide.objects.filter(
        slider=instance.slider, index__gt=instance.index
    ).order_by("index")

    for i, slide in enumerate(slides, start=instance.index):
        slide.index = i
        slide.save(update_fields=["index"])


@receiver(post_delete, sender=Slide)
def validate_index(sender, instance, **kwargs):
    if instance.pk: 
        old_index = Slide.objects.get(pk=instance.pk).index
        if old_index != instance.index:  # اگر ایندکس تغییر کرده باشد
            if instance.index > old_index:
                Slide.objects.filter(
                    slider=instance.slider,
                    index__gt=old_index,
                    index__lte=instance.index,
                ).exclude(pk=instance.pk).update(index=F("index") - 1)
            else:
                Slide.objects.filter(
                    slider=instance.slider,
                    index__lt=old_index,
                    index__gte=instance.index,
                ).exclude(pk=instance.pk).update(index=F("index") + 1)
