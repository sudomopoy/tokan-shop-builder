from django.conf import settings
from django.contrib import admin
from django.contrib import messages
from django.urls import path

from .models import DocSection, PageGuide
from .admin_views import import_markdown_view
from .services.vector_store import VectorStoreService


@admin.register(PageGuide)
class PageGuideAdmin(admin.ModelAdmin):
    list_display = ["path", "has_video_desktop", "has_video_mobile", "has_description"]
    list_filter = []
    search_fields = ["path", "description"]
    ordering = ["path"]
    filter_horizontal = ["doc_sections"]

    def has_video_desktop(self, obj):
        return bool(obj.video_desktop)

    has_video_desktop.boolean = True
    has_video_desktop.short_description = "ویدیو دسکتاپ"

    def has_video_mobile(self, obj):
        return bool(obj.video_mobile)

    has_video_mobile.boolean = True
    has_video_mobile.short_description = "ویدیو موبایل"

    def has_description(self, obj):
        return bool(obj.description)

    has_description.boolean = True
    has_description.short_description = "توضیحات"


@admin.register(DocSection)
class DocSectionAdmin(admin.ModelAdmin):
    list_display = ["title", "order", "tags_preview", "created_at"]
    list_editable = ["order"]
    search_fields = ["title", "body", "tags"]
    ordering = ["order", "title"]
    actions = ["reindex_selected"]

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "import-markdown/",
                self.admin_site.admin_view(import_markdown_view),
                name="guide_docsection_import_markdown",
            ),
        ]
        return custom + urls

    change_list_template = "admin/guide/docsection/change_list.html"

    def tags_preview(self, obj):
        tags = obj.tags if isinstance(obj.tags, list) else []
        return ", ".join(str(t) for t in tags[:5]) if tags else "-"

    tags_preview.short_description = "تگ‌ها"

    @admin.action(description="وکتورایز مجدد انتخاب‌شده‌ها")
    def reindex_selected(self, request, queryset):
        vs = VectorStoreService()
        if not vs.is_available():
            self.message_user(request, "ChromaDB پیکربندی نشده است.", level=messages.WARNING)
            return

        ids = [obj.id for obj in queryset]

        if settings.CELERY_BROKER_URL:
            from .tasks import reindex_doc_sections_task

            reindex_doc_sections_task.delay(ids)
            self.message_user(
                request,
                f"وکتورایز {len(ids)} سکشن به صف Celery فرستاده شد و در پس‌زمینه اجرا می‌شود.",
                level=messages.SUCCESS,
            )
        else:
            count = 0
            for obj in queryset:
                tags = obj.tags if isinstance(obj.tags, list) else []
                if vs.update_document(
                    doc_section_id=str(obj.id),
                    title=obj.title,
                    body=obj.body or "",
                    tags=tags,
                ):
                    count += 1
            self.message_user(request, f"{count} سکشن با موفقیت وکتورایز شد.", level=messages.SUCCESS)
