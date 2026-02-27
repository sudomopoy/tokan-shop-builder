import uuid
from django.db import models


class GuideQuestionUsage(models.Model):
    """
    ردیابی استفاده روزانه از سوال هوش مصنوعی برای هر فروشگاه.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(
        "store.Store",
        on_delete=models.CASCADE,
        related_name="guide_question_usages",
        verbose_name="فروشگاه",
    )
    date = models.DateField(verbose_name="تاریخ")
    count = models.PositiveIntegerField(default=0, verbose_name="تعداد سوال")

    class Meta:
        verbose_name = "استفاده سوال راهنما"
        verbose_name_plural = "استفاده‌های سوال راهنما"
        unique_together = [["store", "date"]]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.store.name} - {self.date}: {self.count}"


class DocSection(models.Model):
    """
    بخش مستندات و راهنما
    هر سکشن: عنوان، تگ‌ها، متن بدنه (مارک‌داون)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(
        max_length=255,
        help_text="عنوان سکشن",
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="لیست تگ‌ها برای دسته‌بندی و جستجو، مثلاً [\"صفحات\", \"سئو\"]",
    )
    body = models.TextField(
        help_text="متن بدنه به صورت مارک‌داون",
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="ترتیب نمایش سکشن‌ها",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "بخش مستندات"
        verbose_name_plural = "بخش‌های مستندات"
        ordering = ["order", "title"]

    def __str__(self):
        return self.title


class PageGuide(models.Model):
    """
    راهنمای هر صفحه داشبورد
    آدرس صفحه، ویدیوها (دسکتاپ/موبایل) و توضیحات اختیاری.
    اگر هیچکدام تعریف نشده باشد، فقط چت هوش مصنوعی نمایش داده می‌شود.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    path = models.CharField(
        max_length=500,
        unique=True,
        help_text="مسیر صفحه داشبورد مثلاً /dashboard یا /dashboard/pages",
    )
    video_desktop = models.URLField(
        max_length=1000,
        null=True,
        blank=True,
        help_text="لینک ویدیو راهنما برای حالت دسکتاپ",
    )
    video_mobile = models.URLField(
        max_length=1000,
        null=True,
        blank=True,
        help_text="لینک ویدیو راهنما برای حالت موبایل",
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="توضیحات متنی راهنما",
    )
    doc_sections = models.ManyToManyField(
        DocSection,
        blank=True,
        related_name="page_guides",
        help_text="بخش‌های مستندات مرتبط با این صفحه",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "راهنمای صفحه"
        verbose_name_plural = "راهنماهای صفحات"
        ordering = ["path"]

    def __str__(self):
        return self.path
