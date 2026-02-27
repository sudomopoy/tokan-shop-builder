from django.apps import AppConfig


class GuideConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "guide"
    verbose_name = "راهنما"

    def ready(self):
        import guide.signals  # noqa: F401
