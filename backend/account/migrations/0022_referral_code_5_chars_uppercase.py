# کد دعوت کوتاه (۵ حرف، فقط حروف بزرگ، بدون حساسیت به حروف بزرگ/کوچک)

import secrets
import string
from django.db import migrations, models


def generate_short_code(used: set) -> str:
    for _ in range(20):
        code = "".join(secrets.choice(string.ascii_uppercase) for _ in range(5))
        if code not in used:
            used.add(code)
            return code
    raise ValueError("Could not generate unique 5-char code")


def regenerate_referral_codes(apps, schema_editor):
    User = apps.get_model("account", "User")
    used = set()
    for user in User.objects.exclude(referral_code__isnull=True).exclude(referral_code=""):
        user.referral_code = generate_short_code(used)
        user.save(update_fields=["referral_code"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0021_user_referred_by"),
    ]

    operations = [
        migrations.RunPython(regenerate_referral_codes, noop),
        migrations.AlterField(
            model_name="user",
            name="referral_code",
            field=models.CharField(
                blank=True,
                max_length=5,
                null=True,
                unique=True,
                verbose_name="کد لینک دعوت افیلیت",
            ),
        ),
    ]
