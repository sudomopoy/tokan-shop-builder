# Remove unique constraint from StoreCategory.slug - multiple categories can share same type (slug)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0035_storecategory_slug_capabilities"),
    ]

    operations = [
        migrations.AlterField(
            model_name="storecategory",
            name="slug",
            field=models.SlugField(blank=True, max_length=50, null=True),
        ),
    ]
