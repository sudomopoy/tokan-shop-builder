from django.urls import path
from .views import StreamPlayView, stream_segment_view

urlpatterns = [
    path("play/<uuid:product_id>/", StreamPlayView.as_view(), name="stream-play"),
    path("segment/<uuid:product_id>/", stream_segment_view, name="stream-segment"),
]
