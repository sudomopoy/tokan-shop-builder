# Celery app را لود کن تا celery -A core کار کند
from .celery import app as celery_app

__all__ = ("celery_app",)
