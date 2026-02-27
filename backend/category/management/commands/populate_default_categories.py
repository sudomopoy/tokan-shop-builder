from django.core.management.base import BaseCommand
from django.conf import settings
from category.models import Category
from category.default_icons import ICON_CHOICES

class Command(BaseCommand):
    help = 'Populate default categories with icons'

    def handle(self, *args, **options):
        # Get or create a default store (you might need to adjust this based on your store setup)
        from store.models import Store
        default_store = Store.objects.first()
        
        if not default_store:
            self.stdout.write(
                self.style.ERROR('No store found. Please create a store first.')
            )
            return

        # Create default categories
        default_categories = [
            ('الکترونیک', 'electronics'),
            ('پوشاک', 'clothing'),
            ('خانه و آشپزخانه', 'home'),
            ('غذا و نوشیدنی', 'food'),
            ('ورزش و سرگرمی', 'sports'),
            ('کتاب و لوازم تحریر', 'books'),
            ('زیبایی و سلامت', 'beauty'),
            ('خودرو و موتورسیکلت', 'automotive'),
            ('اسباب بازی', 'toys'),
            ('سلامت و پزشکی', 'health'),
        ]

        created_count = 0
        for name, icon_key in default_categories:
            category, created = Category.objects.get_or_create(
                name=name,
                store=default_store,
                defaults={
                    'icon_type': 'default',
                    'default_icon': icon_key,
                    'module': 'store',
                    'is_editable': True,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Category already exists: {name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} default categories.')
        )


