"""
Celery tasks for guide app – reindex DocSections در background
"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, name="guide.reindex_doc_sections")
def reindex_doc_sections_task(self, doc_section_ids: list[int]):
    """
    وکتورایز چند DocSection در background.
    doc_section_ids: لیست idهای DocSection برای reindex
    """
    from .models import DocSection
    from .services.vector_store import VectorStoreService

    vs = VectorStoreService()
    if not vs.is_available():
        logger.warning("ChromaDB not configured, reindex skipped")
        return {"success": 0, "failed": len(doc_section_ids), "message": "ChromaDB not configured"}

    count = 0
    for pk in doc_section_ids:
        try:
            obj = DocSection.objects.get(pk=pk)
            tags = obj.tags if isinstance(obj.tags, list) else []
            if vs.update_document(
                doc_section_id=str(obj.id),
                title=obj.title,
                body=obj.body or "",
                tags=tags,
            ):
                count += 1
        except DocSection.DoesNotExist:
            logger.warning("DocSection %s not found, skipped", pk)
        except Exception as e:
            logger.exception("Reindex failed for DocSection %s: %s", pk, e)

    logger.info("Reindex completed: %d/%d doc sections", count, len(doc_section_ids))
    return {"success": count, "total": len(doc_section_ids)}
