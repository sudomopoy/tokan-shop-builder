from django.db import models
from core.abstract_models import BaseStoreModel,BaseModel


class Reaction(BaseStoreModel):
    product = models.ForeignKey("product.Product", on_delete=models.CASCADE)
    rating_aggregated_value = models.IntegerField(default=0)
    likes_count= models.IntegerField(default=0)


class Like(BaseModel):
    reaction = models.ForeignKey("Reaction", on_delete=models.CASCADE)
    store_user = models.ForeignKey("account.StoreUser", on_delete=models.RESTRICT)
    class Meta:
        unique_together = [('reaction','store_user')]


class Comment(BaseModel):
    reaction = models.ForeignKey("Reaction", on_delete=models.CASCADE)
    store_user = models.ForeignKey("account.StoreUser", on_delete=models.RESTRICT)
    description = models.TextField(null=True,blank=True)
    rate = models.IntegerField()
    is_accepted = models.BooleanField(default=True)
    public_profile = models.BooleanField(default=True)
    
    def save(self, force_insert = ..., force_update = ..., using = ..., update_fields = ...):
        if self.rate > 5 or self.rate < 1:
            raise ValueError("rate value is invalid")
        if self.store_user.store == self.product.store == self.store:
            return super().save(force_insert, force_update, using, update_fields)

        raise ValueError("store must be same.")
