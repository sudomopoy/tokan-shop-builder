# ایجاد مدل GuideQuestionUsage

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0027_store_subscription_fields"),
        ("guide", "0003_pageguide_doc_sections"),
    ]

    operations = [
        migrations.CreateModel(
            name="GuideQuestionUsage",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("date", models.DateField(verbose_name="تاریخ")),
                ("count", models.PositiveIntegerField(default=0, verbose_name="تعداد سوال")),
                (
                    "store",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="guide_question_usages",
                        to="store.store",
                        verbose_name="فروشگاه",
                    ),
                ),
            ],
            options={
                "verbose_name": "استفاده سوال راهنما",
                "verbose_name_plural": "استفاده‌های سوال راهنما",
                "ordering": ["-date"],
                "unique_together": {("store", "date")},
            },
        ),
    ]
