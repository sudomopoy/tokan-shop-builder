from PIL import Image
import os


def create_favicon(input_image_path, output_favicon_path="favicon.ico", size=(32, 32)):
    """
    تبدیل عکس به فایل favicon با فرمت .ico

    پارامترها:
    - input_image_path: مسیر فایل عکس ورودی (پشتیبانی از فرمت‌های مختلف)
    - output_favicon_path: مسیر ذخیره فایل favicon (پیش‌فرض: favicon.ico)
    - size: ابعاد دلخواه favicon (پیش‌فرض: 32x32 پیکسل)
    """
    try:
        # باز کردن عکس ورودی
        with Image.open(input_image_path) as img:
            # تغییر سایز با حفظ نسبت ابعاد
            img.thumbnail(size)

            # ایجاد یک تصویر مربعی با پس زمینه شفاف
            square_img = Image.new("RGBA", size, (0, 0, 0, 0))
            square_img.paste(
                img, ((size[0] - img.size[0]) // 2, (size[1] - img.size[1]) // 2)
            )

            # ذخیره به فرمت ico
            square_img.save(output_favicon_path, format="ICO", sizes=[size])

        return True
    except Exception as e:
        print(f"خطا در ایجاد favicon: {e}")
        return False




def optimize_to_webp(input_path, output_path=None, quality=80, lossless=False):
    """
    بهینه‌سازی تصویر و ذخیره با فرمت WEBP

    پارامترها:
    - input_path: مسیر فایل عکس ورودی
    - output_path: مسیر ذخیره فایل خروجی (اگر None باشد، پسوند فایل به .webp تغییر می‌کند)
    - quality: میزان کیفیت (0-100، پیش‌فرض 80)
    - lossless: اگر True باشد، فشرده‌سازی بدون اتلاف انجام می‌شود (پیش‌فرض False)

    بازگشت:
    - مسیر فایل خروجی یا None در صورت خطا
    """
    try:
        # تعیین مسیر خروجی اگر مشخص نشده باشد
        if output_path is None:
            base_name = os.path.splitext(input_path)[0]
            output_path = f"{base_name}.webp"

        with Image.open(input_path) as img:
            # تبدیل به RGB اگر تصویر RGBA باشد و حالت lossless فعال نباشد
            if img.mode == "RGBA" and not lossless:
                img = img.convert("RGB")

            # ذخیره با فرمت WEBP
            img.save(
                output_path,
                format="WEBP",
                quality=quality,
                lossless=lossless,
                method=6,  # روش فشرده‌سازی (0-6، 6 بهترین فشرده‌سازی)
            )

        # مقایسه حجم فایل
        original_size = os.path.getsize(input_path)
        optimized_size = os.path.getsize(output_path)
        reduction = (original_size - optimized_size) / original_size * 100

        print(
            f"حجم فایل از {original_size/1024:.1f}KB به {optimized_size/1024:.1f}KB کاهش یافت ({reduction:.1f}%)"
        )

        return output_path
    except Exception as e:
        print(f"خطا در بهینه‌سازی تصویر: {e}")
        return None
