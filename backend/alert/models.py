from django.db import models
from core.abstract_models import BaseStoreModel

class InventoryAlert(BaseStoreModel):
    product = models.ForeignKey('product.Product')
    user = models.ForeignKey('account.User')
    is_mobile_alert= models.BooleanField(default=False)
    is_email_alert = models.BooleanField(default=False)
    is_notification_alert = models.BooleanField(default=False)

    issued = models.BooleanField(default=False)
