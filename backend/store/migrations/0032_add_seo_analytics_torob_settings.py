# Data migration: add SEO, analytics, torob SettingDefinitions

from django.db import migrations


SEO_ANALYTICS_SETTINGS = [
    ("google_analytics_id", "text", "", "شناسه گوگل آنالیتیکس (اختیاری)", True),
    ("google_tag_manager_id", "text", "", "شناسه گوگل تگ منیجر (اختیاری)", True),
    ("google_search_console_verified", "bool", "false", "تایید گوگل سرچ کنسول (اختیاری)", True),
    ("torob_api_url", "url", "", "لینک یا آدرس API ترب (اختیاری)", True),
]


def add_seo_settings(apps, schema_editor):
    SettingDefinition = apps.get_model("store", "SettingDefinition")
    for key, type_, default, description, can_edit in SEO_ANALYTICS_SETTINGS:
        if not SettingDefinition.objects.filter(key=key).exists():
            SettingDefinition.objects.create(
                key=key,
                type=type_,
                default_value=default,
                description=description,
                can_edit_by_store=can_edit,
            )


def remove_seo_settings(apps, schema_editor):
    SettingDefinition = apps.get_model("store", "SettingDefinition")
    keys = [row[0] for row in SEO_ANALYTICS_SETTINGS]
    SettingDefinition.objects.filter(key__in=keys).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0031_systemconfig_smartsetuprequest_smartsetuppayment"),
    ]

    operations = [
        migrations.RunPython(add_seo_settings, remove_seo_settings),
    ]
