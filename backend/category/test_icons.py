# Test script for category icons functionality
from django.test import TestCase
from django.contrib.auth import get_user_model
from category.models import Category
from category.default_icons import DEFAULT_CATEGORY_ICONS, ICON_CHOICES
from store.models import Store

class CategoryIconTestCase(TestCase):
    def setUp(self):
        # Create a test store
        self.store = Store.objects.create(
            name="Test Store",
            domain="test.com"
        )
        
        # Create a test category with default icon
        self.category = Category.objects.create(
            name="Test Category",
            store=self.store,
            icon_type='default',
            default_icon='electronics'
        )

    def test_default_icon_selection(self):
        """Test that default icon is properly set"""
        self.assertEqual(self.category.icon_type, 'default')
        self.assertEqual(self.category.default_icon, 'electronics')
        self.assertIsNone(self.category.icon)

    def test_icon_url_generation(self):
        """Test icon URL generation for default icons"""
        icon_url = self.category.get_icon_url()
        self.assertEqual(icon_url, "/static/category-icons/electronics.svg")

    def test_icon_svg_generation(self):
        """Test SVG content generation for default icons"""
        svg_content = self.category.get_icon_svg()
        self.assertIsNotNone(svg_content)
        self.assertIn('<svg', svg_content)

    def test_icon_choices_exist(self):
        """Test that all icon choices are available"""
        self.assertEqual(len(ICON_CHOICES), 10)
        
        # Check that all choices have corresponding SVG content
        for choice_key, choice_label in ICON_CHOICES:
            self.assertIn(choice_key, DEFAULT_CATEGORY_ICONS)
            self.assertIsNotNone(DEFAULT_CATEGORY_ICONS[choice_key])

    def test_uploaded_icon(self):
        """Test uploaded icon functionality"""
        # This would require creating a Media object
        # For now, just test the icon_type change
        self.category.icon_type = 'uploaded'
        self.category.save()
        
        self.assertEqual(self.category.icon_type, 'uploaded')
        # icon_url should return None if no uploaded icon
        self.assertIsNone(self.category.get_icon_url())

if __name__ == '__main__':
    # Run basic tests
    print("Testing category icon functionality...")
    
    # Test icon choices
    print(f"Number of icon choices: {len(ICON_CHOICES)}")
    for key, label in ICON_CHOICES:
        print(f"- {key}: {label}")
    
    # Test SVG content
    print(f"\nSVG content for 'electronics':")
    print(DEFAULT_CATEGORY_ICONS.get('electronics', 'Not found'))
    
    print("\nAll tests completed!")


