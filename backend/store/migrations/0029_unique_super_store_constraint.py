# محدودیت DB: فقط یک super_store در سیستم

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0028_ensure_super_store"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="store",
            constraint=models.UniqueConstraint(
                condition=models.Q(_is_super_store=True),
                fields=("_is_super_store",),
                name="unique_super_store",
            ),
        ),
    ]
