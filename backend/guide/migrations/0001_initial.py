# Generated manually for DocSection model

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="DocSection",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(help_text="عنوان سکشن", max_length=255)),
                ("tags", models.JSONField(blank=True, default=list, help_text='لیست تگ‌ها برای دسته‌بندی و جستجو، مثلاً ["صفحات", "سئو"]')),
                ("body", models.TextField(help_text="متن بدنه به صورت مارک‌داون")),
                ("order", models.PositiveIntegerField(default=0, help_text="ترتیب نمایش سکشن‌ها")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "بخش مستندات",
                "verbose_name_plural": "بخش‌های مستندات",
                "ordering": ["order", "title"],
            },
        ),
    ]
