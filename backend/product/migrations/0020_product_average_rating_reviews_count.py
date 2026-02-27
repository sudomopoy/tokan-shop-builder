# Add average_rating and reviews_count to Product

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("product", "0019_product_stock_unlimited_variant_stock_unlimited"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="average_rating",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="میانگین امتیاز نظرات تایید شده (۱–۵)",
                max_digits=3,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="reviews_count",
            field=models.PositiveIntegerField(
                default=0,
                help_text="تعداد نظرات تایید شده",
            ),
        ),
    ]
