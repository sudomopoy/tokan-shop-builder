from celery import Celery
from celery.schedules import crontab

import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

app = Celery("core")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

@app.task
def test(arg):
    print(arg)

@app.on_after_configure.connect
def setup_periodic_tasks(sender:Celery,**kwargs):
    sender.add_periodic_task(
        crontab(minute=1),
        test.s("Hello")
    )
