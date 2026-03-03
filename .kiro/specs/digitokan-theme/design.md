# Design Document - تم Digitokan

## نمای کلی (Overview)

تم Digitokan یک تم مدرن و کامل برای فروشگاه‌ساز توکان است که با استفاده از Material-UI (MUI) v5 پیاده‌سازی می‌شود. این تم از طراحی بصری دیجی‌کالا الهام گرفته و با بهبودهای مدرن، تجربه کاربری روان و زیبایی را ارائه می‌دهد.

### اهداف طراحی

1. **سازگاری با سیستم موجود**: استفاده از ساختار theme registry، SSR، و PageRuntime موجود
2. **طراحی مدرن**: استفاده از MUI components با customization مشابه دیجی‌کالا
3. **عملکرد بالا**: Code splitting، lazy loading، و بهینه‌سازی bundle size
4. **پاسخگویی کامل**: طراحی responsive برای تمام اندازه‌های صفحه
5. **دسترسی‌پذیری**: پشتیبانی کامل از ARIA، keyboard navigation، و screen readers
6. **پشتیبانی RTL**: پشتیبانی کامل از زبان فارسی و راست‌چین

## معماری (Architecture)

### ساختار فولدر

```
frontend/themes/digitokan/
├── manifest.ts                 # تعریف تم و ثبت در registry
├── provider.tsx                # MUI ThemeProvider با تنظیمات سفارشی
├── design-tokens.ts            # توکن‌های طراحی (رنگ، فونت، spacing)
├── theme-config.ts             # تنظیمات MUI theme
├── utils/                      # توابع کمکی
│   ├── rtl.ts                 # تنظیمات RTL
│   └── helpers.ts             # توابع عمومی
└── widgets/                    # تمام ویجت‌ها
    ├── layout/
    │   ├── index.tsx          # Layout اصلی
    │   ├── header/
    │   │   ├── index.tsx      # Header component
    │   │   ├── SearchBar.tsx
    │   │   ├── UserMenu.tsx
    │   │   └── MobileMenu.tsx
    │   └── footer/
    │       └── index.tsx      # Footer component
    ├── product/
    │   ├── detail/
    │   │   ├── index.tsx
    │   │   ├── ImageGallery.tsx
    │   │   ├── ProductInfo.tsx
    │   │   ├── ProductTabs.tsx
    │   │   └── RelatedProducts.tsx
    │   ├── listview/
    │   │   ├── index.tsx
    │   │   └── ProductCard.tsx
    │   └── search/
    │       ├── index.tsx
    │       ├── FilterPanel.tsx
    │       └── SortOptions.tsx
    ├── category/
    │   ├── listview/
    │   │   ├── index.tsx
    │   │   └── CategoryCard.tsx
    │   └── search/
    │       └── index.tsx
    ├── blog/
    │   ├── detail/
    │   │   └── index.tsx
    │   └── listview/
    │       ├── index.tsx
    │       └── ArticleCard.tsx
    ├── slider/
    │   └── index.tsx
    ├── basket/
    │   ├── index.tsx
    │   └── BasketItem.tsx
    ├── checkout/
    │   ├── index.tsx
    │   ├── AddressStep.tsx
    │   ├── ShippingStep.tsx
    │   └── PaymentStep.tsx
    ├── login/
    │   ├── index.tsx
    │   └── OTPVerification.tsx
    ├── profile/
    │   ├── index.tsx
    │   ├── ProfileSidebar.tsx
    │   ├── my_downloads/
    │   │   └── index.tsx
    │   └── my_videos/
    │       └── index.tsx
    ├── order/
    │   ├── detail/
    │   │   └── index.tsx
    │   └── listview/
    │       ├── index.tsx
    │       └── OrderCard.tsx
    ├── menu/
    │   └── index.tsx
    ├── reservation/
    │   └── index.tsx
    ├── home/
    │   ├── features/
    │   │   └── index.tsx
    │   └── newsletter/
    │       └── index.tsx
    ├── content/
    │   ├── text/
    │   │   └── index.tsx
    │   └── image/
    │       └── index.tsx
    ├── form/
    │   └── builder/
    │       └── index.tsx
    └── static/
        ├── 404/
        ├── 403/
        ├── 500/
        ├── about/
        ├── contact/
        ├── faq/
        ├── terms/
        ├── privacy/
        ├── shipping/
        ├── return-policy/
        ├── coming-soon/
        ├── payment-success/
        ├── payment-failed/
        ├── wishlist/
        ├── compare/
        └── loading/
```

### لایه‌های معماری

#### 1. Theme Layer
- **manifest.ts**: ثبت تم در registry
- **provider.tsx**: MUI ThemeProvider با RTL support
- **theme-config.ts**: تنظیمات createTheme
- **design-tokens.ts**: مقادیر ثابت طراحی

#### 2. Widget Layer
- هر ویجت یک React component مستقل
- استفاده از MUI components
- دریافت config از props
- استفاده از PageRuntime برای SSR data

#### 3. Integration Layer
- استفاده از API clients موجود (lib/api)
- یکپارچگی با Redux store
- استفاده از i18n system موجود
- سازگاری با routing structure

## کامپوننت‌ها و رابط‌ها (Components and Interfaces)

### 1. Theme Manifest

```typescript
// manifest.ts
import { ThemeManifest } from "@/themes/types";
import DigitokanThemeProvider from "./provider";

export const themeManifest: ThemeManifest = {
  id: "digitokan",
  provider: DigitokanThemeProvider,
};

export default themeManifest;
```

### 2. Theme Provider

```typescript
// provider.tsx
"use client";

import React, { PropsWithChildren, useMemo } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { prefixer } from "stylis";
import { createDigitokanTheme } from "./theme-config";

// Create RTL cache
const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

export default function DigitokanThemeProvider({ children }: PropsWithChildren) {
  const theme = useMemo(() => createDigitokanTheme(), []);

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
```

### 3. Design Tokens

```typescript
// design-tokens.ts
export const DIGITOKAN_TOKENS = {
  colors: {
    // Primary colors (inspired by Digikala)
    primary: {
      main: "#EF394E",      // Digikala red
      light: "#FF5C6F",
      dark: "#D32F3F",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#19BFD3",      // Digikala cyan
      light: "#4DD0E1",
      dark: "#0097A7",
      contrastText: "#FFFFFF",
    },
    // Neutral colors
    grey: {
      50: "#FAFAFA",
      100: "#F5F5F5",
      200: "#EEEEEE",
      300: "#E0E0E0",
      400: "#BDBDBD",
      500: "#9E9E9E",
      600: "#757575",
      700: "#616161",
      800: "#424242",
      900: "#212121",
    },
    // Semantic colors
    success: {
      main: "#00A049",
      light: "#4CAF50",
      dark: "#00796B",
    },
    warning: {
      main: "#F9A825",
      light: "#FBC02D",
      dark: "#F57F17",
    },
    error: {
      main: "#D32F2F",
      light: "#EF5350",
      dark: "#C62828",
    },
    info: {
      main: "#0288D1",
      light: "#03A9F4",
      dark: "#01579B",
    },
    // Background colors
    background: {
      default: "#F5F5F5",
      paper: "#FFFFFF",
    },
    // Text colors
    text: {
      primary: "#212121",
      secondary: "#757575",
      disabled: "#BDBDBD",
    },
  },
  
  typography: {
    fontFamily: [
      "IRANSans",
      "Vazirmatn",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "sans-serif",
    ].join(","),
    
    // Font sizes
    fontSize: {
      xs: "0.75rem",    // 12px
      sm: "0.875rem",   // 14px
      base: "1rem",     // 16px
      lg: "1.125rem",   // 18px
      xl: "1.25rem",    // 20px
      "2xl": "1.5rem",  // 24px
      "3xl": "1.875rem",// 30px
      "4xl": "2.25rem", // 36px
    },
    
    // Font weights
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },
    
    // Line heights
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },
  
  spacing: {
    unit: 8, // Base spacing unit (8px)
    // Spacing scale: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
  },
  
  borderRadius: {
    none: 0,
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
    "3xl": "24px",
    full: "9999px",
  },
  
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },
  
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
    },
  },
  
  breakpoints: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
  
  zIndex: {
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
} as const;
```

### 4. Theme Configuration

```typescript
// theme-config.ts
import { createTheme, ThemeOptions } from "@mui/material/styles";
import { DIGITOKAN_TOKENS } from "./design-tokens";

export function createDigitokanTheme() {
  const themeOptions: ThemeOptions = {
    direction: "rtl",
    
    palette: {
      primary: DIGITOKAN_TOKENS.colors.primary,
      secondary: DIGITOKAN_TOKENS.colors.secondary,
      error: DIGITOKAN_TOKENS.colors.error,
      warning: DIGITOKAN_TOKENS.colors.warning,
      info: DIGITOKAN_TOKENS.colors.info,
      success: DIGITOKAN_TOKENS.colors.success,
      grey: DIGITOKAN_TOKENS.colors.grey,
      background: DIGITOKAN_TOKENS.colors.background,
      text: DIGITOKAN_TOKENS.colors.text,
    },
    
    typography: {
      fontFamily: DIGITOKAN_TOKENS.typography.fontFamily,
      fontSize: 14,
      
      h1: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize["4xl"],
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.bold,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.tight,
      },
      h2: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize["3xl"],
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.bold,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.tight,
      },
      h3: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize["2xl"],
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.semibold,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.normal,
      },
      h4: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.xl,
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.semibold,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.normal,
      },
      h5: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.lg,
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.medium,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.normal,
      },
      h6: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.base,
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.medium,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.normal,
      },
      body1: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.base,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.relaxed,
      },
      body2: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.sm,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.normal,
      },
      button: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.sm,
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.medium,
        textTransform: "none",
      },
      caption: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.xs,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.normal,
      },
    },
    
    spacing: DIGITOKAN_TOKENS.spacing.unit,
    
    shape: {
      borderRadius: parseInt(DIGITOKAN_TOKENS.borderRadius.md),
    },
    
    shadows: [
      "none",
      DIGITOKAN_TOKENS.shadows.sm,
      DIGITOKAN_TOKENS.shadows.base,
      DIGITOKAN_TOKENS.shadows.md,
      DIGITOKAN_TOKENS.shadows.lg,
      DIGITOKAN_TOKENS.shadows.xl,
      DIGITOKAN_TOKENS.shadows["2xl"],
      // ... repeat for all 25 shadow levels
    ] as any,
    
    transitions: {
      duration: DIGITOKAN_TOKENS.transitions.duration,
      easing: DIGITOKAN_TOKENS.transitions.easing,
    },
    
    breakpoints: {
      values: DIGITOKAN_TOKENS.breakpoints,
    },
    
    zIndex: DIGITOKAN_TOKENS.zIndex,
    
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: DIGITOKAN_TOKENS.borderRadius.lg,
            padding: "10px 24px",
            fontSize: DIGITOKAN_TOKENS.typography.fontSize.sm,
            fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.medium,
            boxShadow: "none",
            "&:hover": {
              boxShadow: DIGITOKAN_TOKENS.shadows.md,
            },
          },
          contained: {
            "&:hover": {
              boxShadow: DIGITOKAN_TOKENS.shadows.lg,
            },
          },
        },
      },
      
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: DIGITOKAN_TOKENS.borderRadius.xl,
            boxShadow: DIGITOKAN_TOKENS.shadows.base,
            "&:hover": {
              boxShadow: DIGITOKAN_TOKENS.shadows.lg,
            },
          },
        },
      },
      
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: DIGITOKAN_TOKENS.borderRadius.lg,
            },
          },
        },
      },
      
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: DIGITOKAN_TOKENS.borderRadius.md,
          },
        },
      },
      
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: DIGITOKAN_TOKENS.shadows.sm,
          },
        },
      },
    },
  };
  
  return createTheme(themeOptions);
}
```

## مدل‌های داده (Data Models)

### Widget Config Interface

```typescript
interface WidgetConfig {
  index?: number;
  widget: string;
  componentsConfig?: Record<string, unknown>;
  extraRequestParams?: Record<string, Record<string, unknown>>;
  widgetConfig?: {
    // Common configs
    title?: string;
    subtitle?: string;
    page_size?: number;
    
    // Layout configs
    header?: boolean;
    footer?: boolean;
    
    // Path params for dynamic routes
    pathParams?: {
      id?: string | number;
      slug?: string;
      code?: string;
      [key: string]: string | number | undefined;
    };
    
    // Slider config
    slider_id?: string;
    
    // Other widget-specific configs
    [key: string]: unknown;
  };
}
```

### Page Runtime Data Structure

```typescript
interface PageRuntimeData {
  product?: {
    detail?: Product;
    listview?: {
      results: Product[];
      count: number;
    };
  };
  category?: {
    tree?: {
      [module: string]: Category[];
    };
  };
  blog?: {
    detail?: Article;
    listview?: {
      results: Article[];
      count: number;
    };
  };
  slider?: {
    [sliderId: string]: {
      active_slides: Slide[];
    };
  };
  [key: string]: unknown;
}
```

### Product Model

```typescript
interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  price: string;
  sell_price: string;
  stock: number;
  stock_unlimited: boolean;
  main_image?: {
    file: string;
  };
  list_images?: Array<{
    file: string;
  }>;
  average_rating?: number;
  reviews_count?: number;
  soled: number;
  // ... other fields
}
```

## خطایابی (Error Handling)

### استراتژی مدیریت خطا

1. **Network Errors**: نمایش پیام خطا با دکمه retry
2. **404 Errors**: هدایت به صفحه 404 سفارشی
3. **Authentication Errors**: هدایت به صفحه login
4. **Validation Errors**: نمایش inline در فرم‌ها
5. **Server Errors**: نمایش صفحه 500 سفارشی

### Error Boundaries

```typescript
// utils/ErrorBoundary.tsx
import React, { Component, ReactNode } from "react";
import { Box, Typography, Button } from "@mui/material";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            p: 3,
          }}
        >
          <Typography variant="h5" gutterBottom>
            خطایی رخ داده است
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            لطفاً صفحه را مجدداً بارگذاری کنید
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
          >
            بارگذاری مجدد
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
```

### Loading States

```typescript
// components/LoadingState.tsx
import { Box, CircularProgress, Skeleton } from "@mui/material";

export function LoadingSpinner() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px",
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export function ProductCardSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" />
    </Box>
  );
}
```



## استراتژی تست (Testing Strategy)

### رویکرد دوگانه تست

تم Digitokan از دو نوع تست استفاده می‌کند:

1. **Unit Tests**: برای تست موارد خاص، edge cases، و شرایط خطا
2. **Property-Based Tests**: برای تست ویژگی‌های کلی در تمام ورودی‌ها

### کتابخانه‌های تست

- **Testing Framework**: Jest + React Testing Library
- **Property-Based Testing**: fast-check
- **Component Testing**: @testing-library/react
- **Mock Data**: faker-js/faker

### تنظیمات Property-Based Testing

- حداقل 100 تکرار برای هر property test
- هر property test باید به property مربوطه در design document اشاره کند
- فرمت tag: `Feature: digitokan-theme, Property {number}: {property_text}`

### ساختار تست‌ها

```
frontend/themes/digitokan/
├── __tests__/
│   ├── unit/
│   │   ├── components/
│   │   │   ├── ProductCard.test.tsx
│   │   │   ├── Header.test.tsx
│   │   │   └── ...
│   │   └── utils/
│   │       ├── helpers.test.ts
│   │       └── rtl.test.ts
│   └── properties/
│       ├── product.properties.test.tsx
│       ├── basket.properties.test.tsx
│       └── ...
```

### مثال Unit Test

```typescript
// __tests__/unit/components/ProductCard.test.tsx
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { createDigitokanTheme } from "../../../theme-config";
import ProductCard from "../../../widgets/product/listview/ProductCard";

describe("ProductCard", () => {
  const theme = createDigitokanTheme();
  
  const mockProduct = {
    id: "1",
    title: "محصول تست",
    price: 100000,
    originalPrice: 150000,
    discountPercent: 33,
    imageUrl: "/test.jpg",
    inStock: true,
    badge: "پرفروش",
    averageRating: 4.5,
    reviewsCount: 10,
  };
  
  it("should render product title", () => {
    render(
      <ThemeProvider theme={theme}>
        <ProductCard product={mockProduct} onAddToBasket={() => {}} adding={false} />
      </ThemeProvider>
    );
    
    expect(screen.getByText("محصول تست")).toBeInTheDocument();
  });
  
  it("should show discount badge when product has discount", () => {
    render(
      <ThemeProvider theme={theme}>
        <ProductCard product={mockProduct} onAddToBasket={() => {}} adding={false} />
      </ThemeProvider>
    );
    
    expect(screen.getByText("33%")).toBeInTheDocument();
  });
  
  it("should show out of stock overlay when product is not in stock", () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    
    render(
      <ThemeProvider theme={theme}>
        <ProductCard product={outOfStockProduct} onAddToBasket={() => {}} adding={false} />
      </ThemeProvider>
    );
    
    expect(screen.getByText("ناموجود")).toBeInTheDocument();
  });
});
```

### مثال Property-Based Test

```typescript
// __tests__/properties/product.properties.test.tsx
import fc from "fast-check";
import { formatPrice } from "../../../utils/helpers";

describe("Product Properties", () => {
  /**
   * Feature: digitokan-theme, Property 1: Price formatting consistency
   * Validates: Requirements 5.4
   */
  it("should format all positive numbers consistently", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000000 }),
        (price) => {
          const formatted = formatPrice(price);
          
          // Property: formatted price should be a string
          expect(typeof formatted).toBe("string");
          
          // Property: formatted price should contain only digits and commas
          expect(formatted).toMatch(/^[\d,]+$/);
          
          // Property: parsing back should give original number
          const parsed = parseInt(formatted.replace(/,/g, ""));
          expect(parsed).toBe(price);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: digitokan-theme, Property 2: Discount calculation accuracy
   * Validates: Requirements 5.12
   */
  it("should calculate discount percentage correctly for all price pairs", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 1000000 }),
        fc.integer({ min: 1, max: 99 }),
        (originalPrice, discountPercent) => {
          const sellPrice = originalPrice * (1 - discountPercent / 100);
          const calculatedDiscount = Math.round(
            ((originalPrice - sellPrice) / originalPrice) * 100
          );
          
          // Property: calculated discount should match original
          expect(calculatedDiscount).toBe(discountPercent);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Coverage Goals

- Unit Test Coverage: حداقل 80%
- Property Test Coverage: تمام ویژگی‌های کلیدی
- Integration Test Coverage: تمام user flows اصلی

### CI/CD Integration

```yaml
# .github/workflows/test-digitokan-theme.yml
name: Test Digitokan Theme

on:
  push:
    paths:
      - 'frontend/themes/digitokan/**'
  pull_request:
    paths:
      - 'frontend/themes/digitokan/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
        
      - name: Run unit tests
        run: npm test -- --coverage --testPathPattern=digitokan
        working-directory: ./frontend
        
      - name: Run property tests
        run: npm test -- --testPathPattern=digitokan/properties
        working-directory: ./frontend
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
```



## ویژگی‌های صحت (Correctness Properties)

### مقدمه

یک property یک ویژگی یا رفتاری است که باید در تمام اجراهای معتبر سیستم صادق باشد - در واقع، یک بیانیه رسمی درباره آنچه سیستم باید انجام دهد. Properties به عنوان پل ارتباطی بین مشخصات قابل خواندن توسط انسان و تضمین‌های صحت قابل تأیید توسط ماشین عمل می‌کنند.

### Property Reflection

پس از تحلیل اولیه prework، properties زیر را برای حذف تکرار بررسی کردیم:

**Properties ترکیب‌شده:**
- Properties مربوط به نمایش اطلاعات محصول (image, title, price, rating) در ProductCard و ProductListView را می‌توان در یک property جامع ترکیب کرد
- Properties مربوط به authentication state در Header (3.9 و 3.10) را می‌توان در یک property ترکیب کرد
- Properties مربوط به visibility در Layout (2.4 و 2.5) را می‌توان در یک property ترکیب کرد

**Properties حذف‌شده:**
- Properties مربوط به استفاده از MUI components (implementation details)
- Properties مربوط به responsive design (نیاز به تست دستی)
- Properties مربوط به animation quality (subjective)

### Core Properties

#### Property 1: Layout Configuration Visibility
*برای هر* تنظیمات widgetConfig با مقادیر header یا footer، نمایش header/footer باید با مقدار boolean مربوطه مطابقت داشته باشد (true = نمایش، false = مخفی)

**Validates: Requirements 2.4, 2.5**

#### Property 2: Authentication State Display
*برای هر* وضعیت authentication کاربر، Header باید دقیقاً یکی از دو حالت را نمایش دهد: profile menu (authenticated) یا login button (not authenticated)

**Validates: Requirements 3.4, 3.9, 3.10**

#### Property 3: Product Card Information Completeness
*برای هر* محصول در ProductListView، ProductCard باید تمام اطلاعات ضروری را نمایش دهد: image، title، price، و rating (اگر موجود باشد)

**Validates: Requirements 6.3**

#### Property 4: Discount Badge Display
*برای هر* محصول که originalPrice > sellPrice، یک discount badge با درصد تخفیف صحیح باید نمایش داده شود

**Validates: Requirements 5.12, 6.4**

#### Property 5: Add to Basket Functionality
*برای هر* محصول موجود، کلیک روی دکمه "افزودن به سبد" باید محصول را به basket اضافه کند و تعداد آیتم‌های basket را یک واحد افزایش دهد

**Validates: Requirements 5.10**

#### Property 6: Unauthenticated Redirect
*برای هر* عملیات که نیاز به authentication دارد (add to basket، checkout)، اگر کاربر authenticated نباشد، باید به صفحه login با next parameter صحیح redirect شود

**Validates: Requirements 5.11**

#### Property 7: Basket Item Display
*برای هر* آیتم در basket، اطلاعات کامل شامل product image، title، price، و quantity باید نمایش داده شود

**Validates: Requirements 12.2**

#### Property 8: Basket Total Calculation
*برای هر* سبد خرید، مجموع قیمت‌ها (subtotal، discount، total) باید با جمع قیمت × تعداد تمام آیتم‌ها مطابقت داشته باشد

**Validates: Requirements 12.5**

#### Property 9: Basket Quantity Update
*برای هر* تغییر در quantity یک آیتم در basket، total price باید به‌طور خودکار و صحیح به‌روز شود

**Validates: Requirements 12.9**

#### Property 10: Slider Image Selection
*برای هر* slide که mobile_image دارد، در viewport موبایل باید mobile_image نمایش داده شود و در viewport دسکتاپ باید desktop_image نمایش داده شود

**Validates: Requirements 8.6**

#### Property 11: Page Size Configuration
*برای هر* مقدار page_size در widgetConfig، ProductListView باید حداکثر همان تعداد محصول را نمایش دهد

**Validates: Requirements 6.10**

#### Property 12: Price Formatting Consistency
*برای هر* عدد مثبت به عنوان قیمت، formatPrice باید یک string با فرمت فارسی (با جداکننده هزارگان) برگرداند که parsing آن عدد اصلی را بازگرداند

**Validates: Requirements 5.4**

#### Property 13: ARIA Labels Presence
*برای هر* element تعاملی (button، link، input)، یک ARIA label یا aria-label attribute مناسب باید وجود داشته باشد

**Validates: Requirements 27.1**

#### Property 14: Semantic HTML Usage
*برای هر* کامپوننت رندر شده، semantic HTML elements (header، nav، main، footer، article، section) باید در جای مناسب استفاده شوند

**Validates: Requirements 27.5**

#### Property 15: SSR Data Hydration
*برای هر* ویجت که از PageRuntime استفاده می‌کند، اگر initialData موجود باشد، باید از آن برای مقداردهی اولیه state استفاده شود و fetch اضافی انجام نشود

**Validates: Requirements 26.3, 28.3**

### Edge Cases

#### Edge Case 1: Empty Product List
*زمانی که* لیست محصولات خالی است، ProductListView باید یک پیام مناسب "محصولی یافت نشد" نمایش دهد

**Validates: Requirements 6.9**

#### Edge Case 2: Empty Basket
*زمانی که* سبد خرید خالی است، Basket widget باید یک empty state با لینک به فروشگاه نمایش دهد

**Validates: Requirements 12.8**

#### Edge Case 3: Single Slide
*زمانی که* slider فقط یک slide دارد، navigation arrows و pagination dots نباید نمایش داده شوند و slide به صورت static نمایش داده شود

**Validates: Requirements 8.9**

#### Edge Case 4: No Search Results
*زمانی که* جستجو نتیجه‌ای ندارد، ProductSearch باید یک پیام راهنما با پیشنهادات جایگزین نمایش دهد

**Validates: Requirements 7.9**

### Example-Based Tests

برخی از requirements به دلیل ماهیت خاص خود، بهتر است با example-based tests تست شوند:

1. **Theme Registry Registration** (Req 1.1): بررسی وجود "digitokan" در registry
2. **Manifest Export** (Req 1.2): بررسی export صحیح manifest
3. **Layout Structure** (Req 2.1-2.3): بررسی رندر header، footer، children
4. **Header Components** (Req 3.1-3.3): بررسی وجود logo، search bar، navigation
5. **Footer Components** (Req 4.1-4.7): بررسی وجود اطلاعات، لینک‌ها، social media
6. **Slider Components** (Req 8.3-8.5): بررسی وجود navigation، pagination، autoplay
7. **Static Pages** (Req 18.1-18.5): بررسی رندر صحیح صفحات استاتیک
8. **Keyboard Navigation** (Req 27.2): بررسی امکان ناوبری با کیبورد
9. **Focus Indicators** (Req 27.4): بررسی وجود focus indicators

### Property Test Implementation Guidelines

هر property test باید:
1. حداقل 100 بار اجرا شود
2. از fast-check برای تولید داده‌های تصادفی استفاده کند
3. با comment مشخص شود که کدام property را تست می‌کند
4. فرمت: `Feature: digitokan-theme, Property {number}: {property_title}`

مثال:

```typescript
/**
 * Feature: digitokan-theme, Property 12: Price Formatting Consistency
 * Validates: Requirements 5.4
 */
it("should format all positive numbers consistently", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 1000000000 }),
      (price) => {
        const formatted = formatPrice(price);
        expect(typeof formatted).toBe("string");
        expect(formatted).toMatch(/^[\d,]+$/);
        const parsed = parseInt(formatted.replace(/,/g, ""));
        expect(parsed).toBe(price);
      }
    ),
    { numRuns: 100 }
  );
});
```

