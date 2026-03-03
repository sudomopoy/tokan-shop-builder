# تم Digitokan

تم مدرن و کامل با استفاده از Material-UI و طراحی مشابه دیجی‌کالا

## ویژگی‌ها

- ✅ استفاده از Material-UI v5
- ✅ پشتیبانی کامل RTL
- ✅ طراحی مشابه دیجی‌کالا با بهبودهای مدرن
- ✅ SSR-ready
- ✅ Responsive Design
- ✅ دسترسی‌پذیری (Accessibility)

## ساختار

```
digitokan/
├── manifest.ts              # تعریف تم
├── provider.tsx             # MUI ThemeProvider با RTL
├── theme-config.ts          # تنظیمات MUI theme
├── design-tokens.ts         # توکن‌های طراحی
├── utils/
│   ├── helpers.ts          # توابع کمکی
│   └── rtl.ts              # توابع RTL
└── widgets/
    ├── layout/             # Layout، Header، Footer
    ├── product/            # Product widgets
    ├── category/           # Category widgets
    ├── blog/               # Blog widgets
    ├── slider/             # Slider widget
    ├── basket/             # Basket widget
    ├── checkout/           # Checkout widget
    ├── login/              # Login widget
    ├── profile/            # Profile widget
    ├── order/              # Order widgets
    ├── menu/               # Menu widget
    ├── reservation/        # Reservation widget
    ├── home/               # Home widgets
    ├── content/            # Content widgets
    ├── form/               # Form builder
    └── static/             # Static pages
```

## استفاده

تم به صورت خودکار از طریق theme registry لود می‌شود.

## توسعه

برای افزودن widget جدید:

1. فایل widget را در مسیر مناسب ایجاد کنید
2. از MUI components استفاده کنید
3. از design tokens برای styling استفاده کنید
4. از PageRuntime برای SSR data استفاده کنید

## Design Tokens

تمام رنگ‌ها، فونت‌ها، spacing و سایر مقادیر طراحی در `design-tokens.ts` تعریف شده‌اند.

## پیاده‌سازی

تم در حال توسعه است. برای پیاده‌سازی کامل، به tasks.md مراجعه کنید.

### وضعیت پیاده‌سازی

- ✅ ساختار اولیه و theme configuration
- ✅ Layout، Header، Footer
- ✅ Helper functions
- 🚧 Product widgets (در حال توسعه)
- 🚧 سایر widgets (برنامه‌ریزی شده)

## نکات مهم

1. همه widgets باید `"use client"` داشته باشند
2. از PageRuntime برای SSR data استفاده کنید
3. از MUI components برای UI استفاده کنید
4. RTL به صورت خودکار توسط provider مدیریت می‌شود
