from django.conf import settings


def deployment_i18n(_request):
    return {
        "deploy_locale": getattr(settings, "DEPLOY_LOCALE", "fa"),
        "deploy_direction": getattr(settings, "DEPLOY_DIRECTION", "rtl"),
    }

