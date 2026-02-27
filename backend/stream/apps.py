from django.apps import AppConfig


class StreamConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "stream"
    verbose_name = "استریم امن"

    def ready(self):
        import stream.signals  # noqa: F401
