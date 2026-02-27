from django.db.models.signals import pre_save
from django.dispatch import receiver
from reaction.models import Comment, Rating
from django.db.models import Avg, Value

@receiver(pre_save, Comment)
def aggregate_rates(sender, instance, created, **kwargs):
    all_comments = Comment.objects.filter(reaction=instance.reaction, is_accepted=True)
    if len(all_comments) == 0:
        instance.reaction.rating_aggregated_value = 0
    else:
        instance.reaction.rating_aggregated_value = all_comments.aggregate(Avg("rate"))
