import re
import unicodedata

def slugify(text):
    # تبدیل به حروف کوچک
    text = text.lower()
    
    # نرمال‌سازی نویسه‌ها (برای حذف اعراب و نویسه‌های خاص)
    text = unicodedata.normalize('NFKD', text)
    text = ''.join(c for c in text if not unicodedata.combining(c))
    
    # حذف علائم نگارشی و نویسه‌های غیرمجاز
    text = re.sub(r'[^\w\s-]', '', text)
    
    # جایگزینی فاصله‌ها و خط‌تیره‌های اضافی با یک خط‌تیره
    text = re.sub(r'[-\s]+', '-', text)
    
    # حذف خط‌تیره‌های ابتدا و انتها
    return text.strip('-')
