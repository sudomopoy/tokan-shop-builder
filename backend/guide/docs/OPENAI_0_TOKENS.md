# مشکل 0 توکن در لاگ OpenAI برای Embeddings

## علت‌های احتمالی

### ۱. درخواست‌های timeout/قطع‌شده
وقتی Gunicorn worker به خاطر timeout قطع می‌شود، درخواست به OpenAI ممکنه ناتمام بمونه. برخی سیستم‌های مانیتورینگ درخواست‌های قطع‌شده رو با 0 توکن ثبت می‌کنن.

**راه‌حل:** با Celery که reindex در background اجرا می‌شود، این مشکل باید برطرف شود.

### ۲. مدل اشتباه (EMBEDDING_MODEL)
اگر `EMBEDDING_PROVIDER=openai` باشه ولی `EMBEDDING_MODEL=paraphrase-multilingual-MiniLM-L12-v2` باشه (مدل HuggingFace)، OpenAI این مدل رو نمی‌شناسه و درخواست fail می‌کنه.

**راه‌حل:** برای OpenAI باید مدلی مثل `text-embedding-3-small` ست بشه. در کد اصلاح شده، اگه مدل متناسب OpenAI نباشه، خودکار از `text-embedding-3-small` استفاده می‌شود.

### ۳. داشبورد اشتباه
لاگ استفاده (Usage) برای **Embeddings** با **Chat Completions** جدا است. در داشبورد OpenAI، بخش Embeddings رو چک کن نه Chat.

### ۴. متن خالی
اگر `body` و `title` DocSection خالی باشن، chunkها خالی می‌شن و ChromaDB ممکنه لیست خالی به embedding بفرسته. در این حالت API call اصلا زده نمی‌شه یا با input خالی fail می‌شه.

---

## چک‌لیست
- [ ] `EMBEDDING_PROVIDER=openai` و `EMBEDDING_MODEL=text-embedding-3-small` (یا مدل معتبر OpenAI)
- [ ] Celery برای reindex فعال باشه
- [ ] در داشبورد OpenAI، بخش **Embeddings** رو بررسی کن
- [ ] DocSectionها body یا title داشته باشن
