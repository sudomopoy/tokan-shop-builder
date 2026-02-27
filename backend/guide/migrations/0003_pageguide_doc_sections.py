# Generated manually - PageGuide M2M to DocSection

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("guide", "0002_pageguide"),
    ]

    operations = [
        migrations.AddField(
            model_name="pageguide",
            name="doc_sections",
            field=models.ManyToManyField(
                blank=True,
                help_text="بخش‌های مستندات مرتبط با این صفحه",
                related_name="page_guides",
                to="guide.docsection",
            ),
        ),
    ]
