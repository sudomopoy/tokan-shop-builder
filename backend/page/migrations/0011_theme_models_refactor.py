# Refactor Theme: ThemeCategory, ThemeTag, ThemeGalleryImage as separate models

import uuid
from django.db import migrations, models
import django.db.models.deletion


def migrate_theme_data(apps, schema_editor):
    """Migrate gallery JSON, tags JSON, category string to new models."""
    Theme = apps.get_model("page", "Theme")
    ThemeCategory = apps.get_model("page", "ThemeCategory")
    ThemeTag = apps.get_model("page", "ThemeTag")
    ThemeGalleryImage = apps.get_model("page", "ThemeGalleryImage")

    for theme in Theme.objects.all():
        # Migrate category
        if theme.category_old:
            base_slug = theme.category_old.lower().replace(" ", "-")[:90] or "cat"
            slug = base_slug
            n = 0
            while ThemeCategory.objects.filter(slug=slug).exists():
                n += 1
                slug = f"{base_slug}-{n}"
            cat, _ = ThemeCategory.objects.get_or_create(
                slug=slug,
                defaults={"name": theme.category_old, "order": 0},
            )
            theme.category = cat
            theme.save()

        # Migrate tags
        tags_json = theme.tags_old or []
        for tag_name in tags_json:
            if isinstance(tag_name, str) and tag_name.strip():
                name = tag_name.strip()
                base_slug = name.lower().replace(" ", "-")[:90] or "tag"
                slug = base_slug
                n = 0
                while ThemeTag.objects.filter(slug=slug).exists():
                    n += 1
                    slug = f"{base_slug}-{n}"
                tag, _ = ThemeTag.objects.get_or_create(
                    slug=slug,
                    defaults={"name": name},
                )
                theme.tags.add(tag)

        # Migrate gallery
        gallery = theme.gallery_old or []
        for idx, item in enumerate(gallery):
            if isinstance(item, dict):
                media_id = item.get("media_id")
                desc = item.get("description", "")
            else:
                media_id = item
                desc = ""
            if media_id:
                try:
                    Media = apps.get_model("media", "Media")
                    media = Media.objects.get(pk=media_id)
                    ThemeGalleryImage.objects.create(
                        theme=theme,
                        media=media,
                        description=desc or "",
                        order=idx,
                    )
                except Exception:
                    pass


def reverse_migrate(apps, schema_editor):
    """Reverse: populate old fields from new models."""
    Theme = apps.get_model("page", "Theme")

    for theme in Theme.objects.all():
        theme.category_old = theme.category.name if theme.category_id else ""
        theme.tags_old = list(theme.tags.values_list("name", flat=True))
        theme.gallery_old = [
            {
                "media_id": str(g.media_id),
                "description": g.description,
            }
            for g in theme.gallery_images.order_by("order")
        ]
        theme.save()


class Migration(migrations.Migration):

    dependencies = [
        ("media", "0001_initial"),
        ("page", "0010_add_default_theme_slug"),
    ]

    operations = [
        migrations.CreateModel(
            name="ThemeCategory",
            fields=[
                ("id", models.UUIDField(editable=False, primary_key=True, serialize=False, default=uuid.uuid4)),
                ("created_at", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now_add=True)),
                ("name", models.CharField(max_length=100)),
                ("slug", models.SlugField(max_length=100, unique=True)),
                ("order", models.PositiveIntegerField(default=0)),
            ],
            options={
                "verbose_name": "Theme Category",
                "verbose_name_plural": "Theme Categories",
                "ordering": ["order", "name"],
            },
        ),
        migrations.CreateModel(
            name="ThemeTag",
            fields=[
                ("id", models.UUIDField(editable=False, primary_key=True, serialize=False, default=uuid.uuid4)),
                ("created_at", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now_add=True)),
                ("name", models.CharField(max_length=100)),
                ("slug", models.SlugField(max_length=100, unique=True)),
            ],
            options={
                "verbose_name": "Theme Tag",
                "verbose_name_plural": "Theme Tags",
                "ordering": ["name"],
            },
        ),
        migrations.RenameField(
            model_name="theme",
            old_name="category",
            new_name="category_old",
        ),
        migrations.RenameField(
            model_name="theme",
            old_name="tags",
            new_name="tags_old",
        ),
        migrations.RenameField(
            model_name="theme",
            old_name="gallery",
            new_name="gallery_old",
        ),
        migrations.CreateModel(
            name="ThemeGalleryImage",
            fields=[
                ("id", models.UUIDField(editable=False, primary_key=True, serialize=False, default=uuid.uuid4)),
                ("created_at", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now_add=True)),
                ("description", models.TextField(blank=True)),
                ("order", models.PositiveIntegerField(default=0)),
                ("media", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="theme_gallery_images", to="media.media")),
                ("theme", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="gallery_images", to="page.theme")),
            ],
            options={
                "verbose_name": "Theme Gallery Image",
                "verbose_name_plural": "Theme Gallery Images",
                "ordering": ["order"],
            },
        ),
        migrations.AddField(
            model_name="theme",
            name="category",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="themes",
                to="page.themecategory",
            ),
        ),
        migrations.AddField(
            model_name="theme",
            name="tags",
            field=models.ManyToManyField(blank=True, related_name="themes", to="page.themetag"),
        ),
        migrations.RunPython(migrate_theme_data, reverse_migrate),
        migrations.RemoveField(
            model_name="theme",
            name="category_old",
        ),
        migrations.RemoveField(
            model_name="theme",
            name="tags_old",
        ),
        migrations.RemoveField(
            model_name="theme",
            name="gallery_old",
        ),
    ]
