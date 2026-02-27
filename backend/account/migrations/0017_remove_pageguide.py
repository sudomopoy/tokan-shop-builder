# Generated manually - move PageGuide from account to docs

from django.db import migrations


def copy_pageguide_to_guide(apps, schema_editor):
    """Copy existing PageGuide data from account to guide before removal."""
    AccountPageGuide = apps.get_model("account", "PageGuide")
    GuidePageGuide = apps.get_model("guide", "PageGuide")
    for obj in AccountPageGuide.objects.all():
        GuidePageGuide.objects.create(
            id=obj.id,
            path=obj.path,
            video_desktop=obj.video_desktop,
            video_mobile=obj.video_mobile,
            description=obj.description,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )


def reverse_copy_pageguide_to_account(apps, schema_editor):
    """Reverse: copy from guide back to account when reverting."""
    GuidePageGuide = apps.get_model("guide", "PageGuide")
    AccountPageGuide = apps.get_model("account", "PageGuide")
    for obj in GuidePageGuide.objects.all():
        AccountPageGuide.objects.create(
            id=obj.id,
            path=obj.path,
            video_desktop=obj.video_desktop,
            video_mobile=obj.video_mobile,
            description=obj.description,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0016_pageguide"),
        ("guide", "0002_pageguide"),
    ]

    operations = [
        migrations.RunPython(copy_pageguide_to_guide, reverse_copy_pageguide_to_account),
        migrations.DeleteModel(name="PageGuide"),
    ]
