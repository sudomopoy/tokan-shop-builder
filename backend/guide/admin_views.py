from django import forms
from django.db.models import Max
from django.contrib import messages
from django.shortcuts import render, redirect
from django.urls import path, reverse
from django.utils.html import format_html

from .models import DocSection
from .markdown_import import parse_markdown_to_sections, _parse_tags_from_string


class MarkdownImportForm(forms.Form):
    """فرم آپلود/ورود مارک‌داون برای تبدیل به DocSection"""

    markdown_file = forms.FileField(
        required=False,
        label="فایل مارک‌داون",
        help_text="می‌توانید یک فایل .md آپلود کنید یا متن را در کادر زیر پیست کنید.",
        widget=forms.FileInput(attrs={"accept": ".md,.markdown,text/markdown,text/plain"}),
    )
    content = forms.CharField(
        required=False,
        widget=forms.Textarea(
            attrs={
                "rows": 20,
                "class": "vLargeTextField",
                "placeholder": "# عنوان اول\n\nمتن بخش اول...\n\n## عنوان دوم\n\nمتن بخش دوم...\n\n---\n\nمی‌توانید از frontmatter هم استفاده کنید:\n---\ntags:\n  - سئو\n  - صفحات\n---",
            }
        ),
        label="متن مارک‌داون",
        help_text="عنوان‌های اصلی (# یا ##) به عنوان title هر سکشن استفاده می‌شوند. برای تگ‌های پیش‌فرض از YAML frontmatter یا فیلد زیر استفاده کنید.",
    )
    default_tags = forms.CharField(
        required=False,
        max_length=500,
        widget=forms.TextInput(
            attrs={
                "placeholder": "سئو, صفحات, راهنما",
                "class": "vTextField",
            }
        ),
        label="تگ پیش‌فرض (اختیاری)",
        help_text="تگ‌های جدا شده با کاما - برای تمام سکشن‌ها اعمال می‌شود.",
    )
    def clean(self):
        data = super().clean()
        content = data.get("content", "").strip()
        if not content and not self.files.get("markdown_file"):
            raise forms.ValidationError("لطفاً متن مارک‌داون را وارد کنید یا فایل آپلود کنید.")
        return data

    replace_existing = forms.BooleanField(
        required=False,
        initial=False,
        label="جایگزینی سکشن‌های فعلی",
        help_text="در صورت تیک زدن، تمام DocSection های موجود حذف و با سکشن‌های جدید جایگزین می‌شوند.",
    )


def import_markdown_view(request):
    """ویژه آپلود مارک‌داون و تبدیل به DocSection"""
    if not request.user.is_staff:
        from django.contrib.auth.views import redirect_to_login

        return redirect_to_login(request.get_full_path())

    form = MarkdownImportForm(request.POST or None, request.FILES or None)
    # اگر فایل آپلود شده، محتوا را از فایل بخوان
    if request.method == "POST" and request.FILES.get("markdown_file"):
        f = request.FILES["markdown_file"]
        try:
            content_from_file = f.read().decode("utf-8")
        except UnicodeDecodeError:
            content_from_file = f.read().decode("latin-1", errors="replace")
        data = request.POST.copy()
        data["content"] = content_from_file
        form = MarkdownImportForm(data, request.FILES)

    if request.method == "POST" and form.is_valid():
        content = form.cleaned_data["content"]
        default_tags_str = form.cleaned_data.get("default_tags", "") or ""
        default_tags = _parse_tags_from_string(default_tags_str)
        replace = form.cleaned_data.get("replace_existing", False)

        try:
            sections = parse_markdown_to_sections(content, default_tags=default_tags)
        except Exception as e:
            messages.error(request, f"خطا در پردازش مارک‌داون: {e}")
            return render(
                request,
                "admin/guide/docsection/import_markdown.html",
                {"form": form, "title": "ورود از مارک‌داون"},
            )

        if not sections:
            messages.warning(request, "هیچ سکشنی در مارک‌داون یافت نشد. حداقل یک عنوان (# یا ##) قرار دهید.")
            return render(
                request,
                "admin/guide/docsection/import_markdown.html",
                {"form": form, "title": "ورود از مارک‌داون"},
            )

        if replace:
            deleted, _ = DocSection.objects.all().delete()
            messages.info(request, f"{deleted} سکشن قبلی حذف شد.")
            max_order = 0
        else:
            max_order = DocSection.objects.aggregate(max_o=Max("order"))["max_o"] or 0

        created = 0
        for s in sections:
            order = max_order + s["order"]
            DocSection.objects.create(
                title=s["title"][:255],
                body=s["body"],
                tags=s["tags"],
                order=order,
            )
            created += 1

        messages.success(request, f"{created} سکشن با موفقیت ایجاد شد.")
        return redirect(reverse("admin:guide_docsection_changelist"))

    return render(
        request,
        "admin/guide/docsection/import_markdown.html",
        {"form": form, "title": "ورود از مارک‌داون"},
    )
