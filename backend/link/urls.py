from django.urls import path
from link.views import redirect_to_original

urlpatterns = [path("redirect/", redirect_to_original, name='redirect')]
