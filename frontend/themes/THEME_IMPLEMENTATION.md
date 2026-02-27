# راهنمای پیاده‌سازی تم‌های فروشگاه ساز

این مستند نحوه ساخت و توسعه تم‌های جدید برای فروشگاه ساز توکان را توضیح می‌دهد. همه صفحات فروشگاه به صورت SSR (سرورساید) رندر می‌شوند و SEO-friendly هستند.

---

## ۱. ساختار فولدر تم

```
themes/
├── registery.ts          # رجیستری تم‌ها
├── types.ts              # تایپ‌های مشترک
├── render.tsx            # رندرر اصلی صفحات
├── runtime/              # پراودر و ابزارهای ران‌تایم
├── default/              # تم پیش‌فرض
│   ├── manifest.ts       # مانیفست تم
│   └── widgets/          # ویجت‌ها
│       ├── layout/
│       ├── product/
│       │   ├── detail/
│       │   ├── listview/
│       │   └── search/
│       ├── category/
│       ├── blog/
│       ├── slider/
│       └── ...
└── serva/                # تم سروا
    ├── manifest.ts
    └── widgets/
        └── ...
```

---

## ۲. ثبت تم در رجیستری

در `themes/registery.ts` تم جدید را اضافه کنید:

```ts
const themeRegistry = {
  default: () => import("./default/manifest"),
  serva: () => import("./serva/manifest"),
  "my-theme": () => import("./my-theme/manifest"),  // تم جدید
};
```

---

## ۳. ساخت مانیفست تم

فایل `manifest.ts` در روت تم:

```ts
import type { ThemeManifest } from "@/themes/types";

const manifest: ThemeManifest = {
  id: "my-theme",
  provider: ({ children }) => <>{children}</>,
};

export default manifest;
```

- `id`: شناسه یکتا (برای مسیر ویجت‌ها)
- `provider`: کامپوننت wrapper برای همه صفحات این تم (مثلاً برای ThemeProvider، یا wrapper استایل)

---

## ۴. ساخت ویجت‌ها

### ۴.۱ نام‌گذاری و مسیر

ویجت‌ها بر اساس نام ناوبری (widget type) که از بک‌اند می‌آید، لود می‌شوند:

| نام ویجت بک‌اند | مسیر فایل |
|-----------------|-----------|
| `layout` | `widgets/layout/index.tsx` |
| `product.detail` | `widgets/product/detail/index.tsx` |
| `product.listview` | `widgets/product/listview/index.tsx` |
| `category.listview` | `widgets/category/listview/index.tsx` |
| `blog.detail` | `widgets/blog/detail/index.tsx` |
| `slider` | `widgets/slider/index.tsx` |

### ۴.۲ SSR و داده پیش‌بارگذاری شده

تم‌ها باید از **داده پیش‌بارگذاری شده روی سرور** استفاده کنند تا صفحه به صورت کامل SSR شود و SEO-friendly باشد.

**ویجت‌هایی که نیاز به fetch دارند** باید از `usePageRuntime()` و `initialData` استفاده کنند:

```tsx
"use client";

import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import type { WidgetConfig } from "@/themes/types";

export default function ProductDetail({ config }: { config?: WidgetConfig }) {
  const { data, setData } = usePageRuntime();

  // خواندن داده پیش‌بارگذاری شده SSR
  const ssrProduct = (data?.product as Record<string, unknown>)?.["detail"] as Product | undefined;

  const [product, setProduct] = useState<Product | null>(ssrProduct ?? null);
  const [loading, setLoading] = useState(!ssrProduct);

  useEffect(() => {
    if (ssrProduct && String(ssrProduct.id) === String(id)) {
      setLoading(false);
      return;
    }
    // fetch روی کلاینت فقط وقتی داده SSR نداریم (مثلاً ناوبری سمت کلاینت)
    productApi.get(id).then((fetched) => {
      setProduct(fetched);
      setData("product.detail", fetched);
    });
  }, [id, ssrProduct]);

  // ...
}
```

### ۴.۳ کلیدهای داده در PageRuntime (initialData)

داده‌ها در ساختار تو در تو ذخیره می‌شوند. کلیدهای استاندارد:

| ویجت | کلید در `data` | نوع داده |
|------|-----------------|----------|
| product.detail | `data.product.detail` | `Product` |
| product.listview | `data.product.listview` | `{ results: Product[] }` |
| category.listview | `data.category.tree.<module>` | `Category[]` (مثلاً `data.category.tree.STORE`) |
| blog.detail | `data.blog.detail` | `Article` |
| slider | `data.slider.<sliderId>` | `Slider` (با `active_slides`) |

**افزودن ویجت جدید به fetchPageWidgetData**: اگر ویجتی داده خاصی را fetch می‌کند، باید در `lib/server/fetchPageWidgetData.ts` اضافه شود تا داده روی سرور پیش‌بارگذاری شود.

---

## ۵. تنظیمات SEO و قالب‌های داینامیک

صفحات از `generateMetadata` در Next.js برای SEO استفاده می‌کنند. برای صفحات داینامیک (مثل جزئیات محصول/مقاله) می‌توانید قالب‌های زیر را در داشبورد صفحه تعریف کنید:

```
{{ data.product.detail.title }}
{{ data.product.detail.short_description }}
{{ data.blog.detail.title }}
{{ data.blog.detail.description }}
```

اگر Meta Title یا Meta Description خالی باشد، به‌طور خودکار از اطلاعات ویجت‌ها پر می‌شود.

---

## ۶. ویجت‌های layout

ویجت layout یک بار در هر صفحه استفاده می‌شود و فرزندانش ویجت‌های محتوا هستند:

```tsx
export default function Layout({ config, children }: { config?: WidgetConfig; children?: ReactNode }) {
  return (
    <div>
      {config?.widgetConfig?.header !== false && <Header />}
      <main>{children}</main>
      {config?.widgetConfig?.footer !== false && <Footer />}
    </div>
  );
}
```

---

## ۷. نکات مهم

1. **همه ویجت‌ها باید `"use client"` داشته باشند** اگر از hooks (useState، useEffect و...) استفاده می‌کنند.
2. **SSR اولویت دارد**: همیشه ابتدا از `data` در `usePageRuntime()` برای مقداردهی اولیه state استفاده کنید.
3. **نام ویجت باید دقیقاً مطابق بک‌اند باشد** (مثلاً `product.detail` نه `productDetail`).
4. **pathParams** برای صفحات داینامیک در `config.widgetConfig.pathParams` قرار دارد (مثلاً `id`، `slug`).

---

## ۸. چک‌لیست تم جدید

- [ ] فولدر تم با ساختار `manifest.ts` و `widgets/`
- [ ] ثبت در `registery.ts`
- [ ] ویجت‌های layout و content با مسیر صحیح
- [ ] استفاده از `usePageRuntime()` و `initialData` برای ویجت‌های داده‌محور
- [ ] در صورت نیاز: به‌روزرسانی `fetchPageWidgetData.ts` برای ویجت‌های جدید
- [ ] تست SSR با مشاهده سورس HTML خروجی صفحه
