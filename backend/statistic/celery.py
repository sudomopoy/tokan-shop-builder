import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
import django
django.setup()

from django_redis import get_redis_connection
from celery import Celery, shared_task
from django.conf import settings
from .models import  *
import time
from django.db import transaction
from article.models import Article
import logging
from celery.schedules import crontab

flush_script_path = settings.BASE_DIR / 'lua/flush_views.lua'
flush_script = ''
conn = get_redis_connection("default")

with open(flush_script_path, 'r') as script_file:
    flush_script = script_file.read()

logging.info("Flush script read successfully.")


celery = Celery("statistic")
celery.config_from_object("django.conf:settings", namespace="CELERY")
celery.autodiscover_tasks()
celery.conf.timezone = 'UTC'




@celery.task
def flush_views_task():
    try:
        result = conn.eval(flush_script, 0)
        with transaction.atomic():
            for item in result:
                article_id, views = item
                article = Article.objects.get(id=article_id)
                article.total_views += views
                article.save()
        logging.info(f"{time.time()}: {len(result)} views flushed to database")
    except Exception as e:
        logging.error(f"error while flushing views: {str(e)}")


@celery.on_after_configure.connect
def setup_periodic_tasks(sender: Celery, **kwargs):
    sender.add_periodic_task(crontab(minute='*'), flush_views_task, name='flush every min')

