# Data migration: add contact, social and trust badge SettingDefinitions

from django.db import migrations


CONTACT_SETTINGS = [
    ("store_phone", "text", "", "شماره تماس فروشگاه", True),
    ("store_email", "text", "", "ایمیل فروشگاه", True),
    ("store_address", "text", "", "آدرس فروشگاه", True),
    ("social_instagram_url", "url", "", "لینک اینستاگرام", True),
    ("social_telegram_url", "url", "", "لینک تلگرام", True),
    ("social_whatsapp_url", "url", "", "لینک واتساپ", True),
    ("social_twitter_url", "url", "", "لینک توییتر", True),
    ("social_linkedin_url", "url", "", "لینک لینکدین", True),
    ("trust_enamad_url", "url", "", "لینک نماد اعتماد الکترونیکی (e-Namad)", True),
    ("trust_samandehi_url", "url", "", "لینک ساماندهی", True),
]


def add_contact_settings(apps, schema_editor):
    SettingDefinition = apps.get_model("store", "SettingDefinition")
    for key, type_, default, description, can_edit in CONTACT_SETTINGS:
        if not SettingDefinition.objects.filter(key=key).exists():
            SettingDefinition.objects.create(
                key=key,
                type=type_,
                default_value=default,
                description=description,
                can_edit_by_store=can_edit,
            )


def remove_contact_settings(apps, schema_editor):
    SettingDefinition = apps.get_model("store", "SettingDefinition")
    keys = [row[0] for row in CONTACT_SETTINGS]
    SettingDefinition.objects.filter(key__in=keys).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0025_store_theme_slug"),
    ]

    operations = [
        migrations.RunPython(add_contact_settings, remove_contact_settings),
    ]
