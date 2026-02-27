from django.core.management.base import BaseCommand

from guide.models import DocSection
from guide.services.vector_store import VectorStoreService


class Command(BaseCommand):
    help = "وکتورایز مجدد تمام DocSection ها در ChromaDB"

    def handle(self, *args, **options):
        vs = VectorStoreService()
        if not vs.is_available():
            self.stderr.write("ChromaDB پیکربندی نشده یا در دسترس نیست.")
            return
        count = 0
        for obj in DocSection.objects.all():
            tags = obj.tags if isinstance(obj.tags, list) else []
            if vs.update_document(
                doc_section_id=str(obj.id),
                title=obj.title,
                body=obj.body or "",
                tags=tags,
            ):
                count += 1
        self.stdout.write(self.style.SUCCESS(f"{count} سکشن وکتورایز شد."))
