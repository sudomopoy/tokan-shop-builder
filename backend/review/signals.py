from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import ProductReview


def recalc_product_rating(product):
    """محاسبه و به‌روزرسانی میانگین امتیاز و تعداد نظرات تایید شده محصول."""
    from django.db.models import Avg, Count
    from product.models import Product

    stats = ProductReview.objects.filter(
        product=product,
        status=ProductReview.STATUS_APPROVED,
    ).aggregate(
        avg=Avg("rating"),
        cnt=Count("id"),
    )
    Product.objects.filter(pk=product.pk).update(
        average_rating=stats["avg"],
        reviews_count=stats["cnt"] or 0,
    )


@receiver(post_save, sender=ProductReview)
def on_review_saved(sender, instance, created, **kwargs):
    recalc_product_rating(instance.product)


@receiver(post_delete, sender=ProductReview)
def on_review_deleted(sender, instance, **kwargs):
    recalc_product_rating(instance.product)
