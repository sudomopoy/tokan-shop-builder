from django.apps import AppConfig


class SliderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'slider'
    def ready(self):
        import slider.signals
        return super().ready()