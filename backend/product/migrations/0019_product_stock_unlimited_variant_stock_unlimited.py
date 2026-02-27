# Generated manually for stock_unlimited feature

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("product", "0018_product_streaming_source_and_upload"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="stock_unlimited",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="variant",
            name="stock_unlimited",
            field=models.BooleanField(default=False),
        ),
    ]
