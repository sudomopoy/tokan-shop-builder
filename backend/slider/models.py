from core.abstract_models import BaseStoreModel
from django.db import models
from django.db.models import Max, F

class Slider(BaseStoreModel):
    title = models.CharField(max_length=300)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class Slide(BaseStoreModel):
    slider = models.ForeignKey(
        "Slider", on_delete=models.CASCADE, related_name="slides"
    )
    title = models.CharField(max_length=300, null=True, blank=True)
    alt = models.CharField(max_length=300, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    desktop_image = models.ForeignKey(
        "media.Media", on_delete=models.CASCADE, related_name="slide_desktop_image"
    )
    mobile_image = models.ForeignKey(
        "media.Media",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="slide_mobile_image",
    )

    url = models.CharField(max_length=500, null=True, blank=True)
    button_text = models.CharField(max_length=200, null=True, blank=True)
    show_button = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    index = models.PositiveIntegerField(null=True)

    def __str__(self):
        return f"{self.slider.title} {self.index}"

    class Meta:
        ordering = ["slider", "index"]  # مرتب‌سازی بر اساس اسلایدر و ایندکس
        unique_together = [("slider", "index")]

    def save(self, *args, **kwargs):
        if not self.pk:  # فقط برای اسلایدهای جدید
            # پیدا کردن بیشترین ایندکس موجود برای این اسلایدر
            max_index = Slide.objects.filter(slider=self.slider).aggregate(
                Max("index")
            )["index__max"]
            self.index = (max_index or -1) + 1
        super().save(*args, **kwargs)
