from django import forms
from django.db.models import Max
from django.contrib import messages
from django.shortcuts import render, redirect
from django.urls import path, reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import DocSection
from .markdown_import import parse_markdown_to_sections, _parse_tags_from_string


class MarkdownImportForm(forms.Form):
    """Markdown upload/input form to create DocSection records."""

    markdown_file = forms.FileField(
        required=False,
        label=_("Markdown file"),
        help_text=_("Upload a .md file or paste markdown text below."),
        widget=forms.FileInput(attrs={"accept": ".md,.markdown,text/markdown,text/plain"}),
    )
    content = forms.CharField(
        required=False,
        widget=forms.Textarea(
            attrs={
                "rows": 20,
                "class": "vLargeTextField",
                "placeholder": "# Main title\n\nSection body...\n\n## Second title\n\nSection body...\n\n---\n\nYou can also use frontmatter:\n---\ntags:\n  - seo\n  - pages\n---",
            }
        ),
        label=_("Markdown content"),
        help_text=_("Use # or ## headings for section titles. Set default tags via YAML frontmatter or the field below."),
    )
    default_tags = forms.CharField(
        required=False,
        max_length=500,
        widget=forms.TextInput(
            attrs={
                "placeholder": "seo, pages, docs",
                "class": "vTextField",
            }
        ),
        label=_("Default tags (optional)"),
        help_text=_("Comma-separated tags applied to all imported sections."),
    )
    def clean(self):
        data = super().clean()
        content = data.get("content", "").strip()
        if not content and not self.files.get("markdown_file"):
            raise forms.ValidationError(_("Please provide markdown text or upload a file."))
        return data

    replace_existing = forms.BooleanField(
        required=False,
        initial=False,
        label=_("Replace existing sections"),
        help_text=_("When enabled, all existing DocSection records are deleted before import."),
    )


def import_markdown_view(request):
    """Upload markdown and convert it to DocSection rows."""
    if not request.user.is_staff:
        from django.contrib.auth.views import redirect_to_login

        return redirect_to_login(request.get_full_path())

    form = MarkdownImportForm(request.POST or None, request.FILES or None)
    # If a file was uploaded, read markdown content from file.
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
            messages.error(
                request,
                _("Failed to parse markdown: %(error)s") % {"error": e},
            )
            return render(
                request,
                "admin/guide/docsection/import_markdown.html",
                {"form": form, "title": _("Import from markdown")},
            )

        if not sections:
            messages.warning(
                request,
                _("No sections found in markdown. Add at least one # or ## heading."),
            )
            return render(
                request,
                "admin/guide/docsection/import_markdown.html",
                {"form": form, "title": _("Import from markdown")},
            )

        if replace:
            deleted, _ = DocSection.objects.all().delete()
            messages.info(
                request,
                _("%(count)s previous sections were deleted.") % {"count": deleted},
            )
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

        messages.success(
            request,
            _("%(count)s sections were created successfully.") % {"count": created},
        )
        return redirect(reverse("admin:guide_docsection_changelist"))

    return render(
        request,
        "admin/guide/docsection/import_markdown.html",
        {"form": form, "title": _("Import from markdown")},
    )
