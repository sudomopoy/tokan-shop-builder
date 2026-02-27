from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import DocSection
from .services.vector_store import VectorStoreService


@receiver(post_save, sender=DocSection)
def vectorize_doc_section(sender, instance, created, **kwargs):
    vs = VectorStoreService()
    if not vs.is_available():
        return
    tags = instance.tags if isinstance(instance.tags, list) else []
    vs.update_document(
        doc_section_id=str(instance.id),
        title=instance.title,
        body=instance.body or "",
        tags=tags,
    )


@receiver(post_delete, sender=DocSection)
def remove_doc_section_from_vector(sender, instance, **kwargs):
    vs = VectorStoreService()
    if vs.is_available():
        vs.delete_document(str(instance.id))
