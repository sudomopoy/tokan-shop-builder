# Category Icon System

This document explains the new category icon system that allows admins to select from 10 default icons or upload custom images.

## Features

### 1. Default Icons
The system includes 10 pre-designed SVG icons for common store categories:
- الکترونیک (Electronics)
- پوشاک (Clothing)
- خانه و آشپزخانه (Home & Kitchen)
- غذا و نوشیدنی (Food & Beverages)
- ورزش و سرگرمی (Sports & Entertainment)
- کتاب و لوازم تحریر (Books & Stationery)
- زیبایی و سلامت (Beauty & Health)
- خودرو و موتورسیکلت (Automotive)
- اسباب بازی (Toys)
- سلامت و پزشکی (Health & Medical)

### 2. Custom Icon Upload
Admins can also upload custom images as category icons.

## Model Changes

The `Category` model now includes:
- `icon_type`: Choice between 'default' and 'uploaded'
- `default_icon`: Selection from predefined icons
- `icon`: Foreign key to Media model for uploaded images

## Admin Interface

The admin interface provides:
- Radio button selection for icon type
- Visual icon selection with SVG previews
- File upload for custom icons
- Icon preview in the category list

## API Changes

The API now returns:
- `icon_type`: Type of icon (default/uploaded)
- `default_icon`: Selected default icon key
- `icon_url`: URL to the icon (for both types)
- `icon_svg`: SVG content for default icons

## Usage

### In Admin Panel
1. Go to Categories in admin
2. Create or edit a category
3. Choose icon type: "آیکون پیش‌فرض" or "آیکون آپلود شده"
4. If default: select from the visual icon grid
5. If uploaded: upload an image file

### Via API
```json
{
  "name": "الکترونیک",
  "icon_type": "default",
  "default_icon": "electronics"
}
```

### Getting Icon URL
```python
category = Category.objects.get(name="الکترونیک")
icon_url = category.get_icon_url()
icon_svg = category.get_icon_svg()
```

## Management Commands

Populate default categories with icons:
```bash
python manage.py populate_default_categories
```

## Static Files

The system includes:
- CSS for icon selection interface (`category/static/admin/css/category_admin.css`)
- JavaScript for interactive icon selection (`category/static/admin/js/category_admin.js`)

## Migration

Run the migration to add the new fields:
```bash
python manage.py migrate category
```


