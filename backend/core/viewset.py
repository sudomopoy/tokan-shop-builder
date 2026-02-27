from rest_framework import viewsets
from django.db.models import Q


class BaseStoreViewSet(viewsets.ModelViewSet):
    """
    ویوِیسِت پایه که به صورت خودکار همه‌چیز را بر اساس store فیلتر می‌کند.
    """

    def get_queryset(self):
        queryset = super().get_queryset()
        print('tttttttt',len(queryset))
        # اگر مدل فیلد store نداشت، فیلتر نشود
        if not hasattr(queryset.model, "store"):
            return queryset
        if hasattr(self.request, "store") and getattr(self.request.store, "_is_super_store", False):
            return queryset.filter(
                    Q(store__super_store=self.request.store) | Q(store=self.request.store)
            )
        # اگر کاربر متعلق به یک store است، فیلتر اعمال شود
        if hasattr(self.request, "store"):
            return queryset.filter(store=self.request.store)
        print('xxxxxxxxx',len(queryset))

        return queryset

    def perform_create(self, serializer):
        """به صورت خودکار store را به آبجکت جدید اختصاص می‌دهد."""
        if hasattr(self.request, "store") and hasattr(serializer.Meta.model, "store"):
            serializer.save(store=self.request.store)
        else:
            serializer.save()

