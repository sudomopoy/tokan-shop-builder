from django.forms import widgets, JSONField
from django.contrib.admin import widgets as admin_widgets


class ProductJSONWidget(widgets.Textarea):
    template_name = "admin/product_information_widget.html"

    class Media:
        css = {
            "all": (
                "https://s3-public.ropomoda.com/bootstrap@5.1.3/dist/css/bootstrap.min.css",
                "https://s3-public.ropomoda.com/static/css/product_information_widget.css",
            )
        }
        js = (
            "https://s3-public.ropomoda.com/jquery@3.6.0/dist/jquery.min.js",
            "https://s3-public.ropomoda.com/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js",
            "https://s3-public.ropomoda.com/static/js/product_information_widget.js",
        )
