"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Container,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
  Drawer,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Skeleton,
  Fade,
  LinearProgress,
} from "@mui/material";
import {
  Search,
  ShoppingCart,
  SlidersHorizontal,
  X,
  Loader2,
  Package,
} from "lucide-react";
import { productApi, basketApi, categoryApi, type Product } from "@/lib/api";
import type { Category as StoreCategory } from "@/lib/api/categoryApi";
import type { WidgetConfig } from "@/themes/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fa-IR").format(price);
};

const slugify = (text: string): string => {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "product"
  );
};

const SORT_OPTIONS = [
  { value: "", label: "پیش‌فرض" },
  { value: "-created_at", label: "جدیدترین" },
  { value: "created_at", label: "قدیمی‌ترین" },
  { value: "sell_price", label: "ارزان‌ترین" },
  { value: "-sell_price", label: "گران‌ترین" },
] as const;

const PAGE_SIZE = 24;

type ProductCardData = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  inStock: boolean;
  badge: string | null;
};

function ProductCardSkeleton() {
  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
        border: "1px solid",
        borderColor: "grey.200",
      }}
    >
      <Skeleton variant="rectangular" sx={{ aspectRatio: "1", width: "100%" }} animation="wave" />
      <CardContent sx={{ p: 2, pt: 1.5, pb: 1.5 }}>
        <Skeleton variant="text" width="90%" height={24} sx={{ mb: 1 }} animation="wave" />
        <Skeleton variant="text" width="70%" height={24} sx={{ mb: 1.5 }} animation="wave" />
        <Skeleton variant="text" width="50%" height={32} animation="wave" />
      </CardContent>
      <Box sx={{ p: 2, pt: 0 }}>
        <Skeleton variant="rounded" height={44} animation="wave" />
      </Box>
    </Card>
  );
}

const mapProductToCardData = (product: Product): ProductCardData => {
  const sellPrice = parseFloat(product.sell_price);
  const originalPrice = parseFloat(product.price);
  const hasDiscount = originalPrice > sellPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - sellPrice) / originalPrice) * 100 * 10) / 10
    : 0;
  const imageUrl =
    product.main_image?.file ||
    product.list_images?.[0]?.file ||
    "https://via.placeholder.com/400x400?text=بدون+تصویر";
  const inStock = product.stock_unlimited || (product.stock ?? 0) > 0;
  let badge: string | null = null;
  if (inStock) {
    if (product.soled > 10) badge = "پرفروش";
    else if (discountPercent > 15) badge = "تخفیف ویژه";
  }
  return {
    id: product.id,
    name: product.title,
    price: sellPrice,
    originalPrice: originalPrice,
    discount: discountPercent,
    image: imageUrl,
    inStock,
    badge,
  };
};

function ProductSearchCard({
  product,
  onAddToBasket,
  isAddingToBasket,
}: {
  product: ProductCardData;
  onAddToBasket: (id: string) => void;
  isAddingToBasket: boolean;
}) {
  const hasDiscount = product.originalPrice > product.price;
  const productUrl = `/product/${product.id}/${slugify(product.name)}`;

  return (
    <Card
      className="group"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
        border: "1px solid",
        borderColor: "grey.200",
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
          transform: "translateY(-4px)",
          borderColor: "grey.300",
        },
      }}
    >
      <Link
        href={productUrl}
        style={{
          textDecoration: "none",
          color: "inherit",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            bgcolor: "grey.50",
            aspectRatio: "1",
          }}
        >
          <CardMedia
            component="img"
            image={product.image}
            alt={product.name}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.4s ease",
              "&:hover": { transform: "scale(1.08)" },
            }}
          />
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              position: "absolute",
              top: 10,
              insetInlineStart: 10,
              insetInlineEnd: 10,
              zIndex: 2,
            }}
          >
            {product.badge && (
              <Chip
                label={product.badge}
                size="small"
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  height: 24,
                  "& .MuiChip-label": { px: 1.25 },
                }}
              />
            )}
            {hasDiscount && (
              <Chip
                label={`${product.discount}%`}
                size="small"
                sx={{
                  bgcolor: "error.main",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  height: 24,
                  "& .MuiChip-label": { px: 1.25 },
                }}
              />
            )}
          </Stack>
          {!product.inStock && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <Chip
                label="ناموجود"
                sx={{ bgcolor: "error.main", color: "white", fontWeight: 600 }}
              />
            </Box>
          )}
        </Box>
        <CardContent
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            p: 2,
            pt: 1.5,
            pb: 1.5,
          }}
        >
          <Typography
            variant="h6"
            component="h3"
            className="line-clamp-2"
            sx={{
              fontWeight: 600,
              fontSize: "1rem",
              color: "text.primary",
              lineHeight: 1.5,
              mb: 1,
              minHeight: 48,
            }}
          >
            {product.name}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            alignItems="baseline"
            flexWrap="wrap"
            sx={{ mt: "auto" }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                fontSize: "1.05rem",
              }}
            >
              {formatPrice(product.price)}
            </Typography>
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              تومان
            </Typography>
            {hasDiscount && (
              <Typography
                variant="body2"
                sx={{
                  textDecoration: "line-through",
                  color: "text.secondary",
                  fontSize: "0.8rem",
                }}
              >
                {formatPrice(product.originalPrice)}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Link>
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          size="medium"
          startIcon={
            isAddingToBasket ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <ShoppingCart size={18} />
            )
          }
          disabled={!product.inStock || isAddingToBasket}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToBasket(product.id);
          }}
          sx={{
            borderRadius: 2,
            py: 1.25,
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          {isAddingToBasket ? "..." : "افزودن به سبد"}
        </Button>
      </Box>
    </Card>
  );
}

function CategoryFilterItem({
  category,
  depth = 0,
  selectedCategories,
  onCategoryToggle,
}: {
  category: StoreCategory;
  depth?: number;
  selectedCategories: string[];
  onCategoryToggle: (id: string) => void;
}) {
  return (
    <Box>
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={selectedCategories.includes(category.id)}
            onChange={() => onCategoryToggle(category.id)}
          />
        }
        label={
          <Typography variant="body2" noWrap>
            {depth > 0 && "↳ "}
            {category.name}
          </Typography>
        }
        sx={{ pl: depth * 2 }}
      />
      {category.children?.length
        ? category.children.map((child) => (
            <CategoryFilterItem
              key={child.id}
              category={child}
              depth={depth + 1}
              selectedCategories={selectedCategories}
              onCategoryToggle={onCategoryToggle}
            />
          ))
        : null}
    </Box>
  );
}

function FilterSidebar({
  categories,
  selectedCategories,
  inStockOnly,
  onCategoryToggle,
  onInStockChange,
  onClear,
  hasActiveFilters,
  disabled,
}: {
  categories: StoreCategory[];
  selectedCategories: string[];
  inStockOnly: boolean;
  onCategoryToggle: (id: string) => void;
  onInStockChange: (v: boolean) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  disabled?: boolean;
}) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        p: 2,
        position: "sticky",
        top: 24,
        opacity: disabled ? 0.7 : 1,
        pointerEvents: disabled ? "none" : "auto",
        transition: "opacity 0.2s",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          فیلترها
        </Typography>
        {hasActiveFilters && (
          <Button size="small" onClick={onClear} sx={{ textTransform: "none" }}>
            پاک کردن
          </Button>
        )}
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
        دسته‌بندی
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 2, maxHeight: 280, overflow: "auto" }}>
        {categories.map((cat) => (
          <CategoryFilterItem
            key={cat.id}
            category={cat}
            selectedCategories={selectedCategories}
            onCategoryToggle={onCategoryToggle}
          />
        ))}
      </Stack>
      <Divider sx={{ my: 2 }} />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={inStockOnly}
            onChange={(_, c) => onInStockChange(c)}
          />
        }
        label={
          <Typography variant="body2">
            فقط کالاهای موجود
          </Typography>
        }
      />
    </Box>
  );
}

export default function ProductsSearch({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const initialQuery = searchParams?.get("q") ?? "";
  const initialSort = searchParams?.get("sort") ?? "";
  const initialCategories = searchParams?.get("categories")
    ? searchParams.get("categories")!.split(",").filter(Boolean)
    : [];
  const initialInStock = searchParams?.get("in_stock") === "1";

  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(true);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [sort, setSort] = useState(initialSort);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [inStockOnly, setInStockOnly] = useState(initialInStock);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const hasActiveFilters = selectedCategories.length > 0 || inStockOnly;

  useEffect(() => {
    let mounted = true;
    setCategoriesLoading(true);
    categoryApi
      .tree({ module: "STORE" })
      .then((tree) => {
        if (mounted) {
          const filtered =
            Array.isArray(tree) && tree.length > 0
              ? tree.filter((c) => c.module === "STORE")
              : [];
          setCategories(filtered);
        }
      })
      .catch(() => {
        if (mounted) setCategories([]);
      })
      .finally(() => {
        if (mounted) setCategoriesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const buildParams = useCallback(
    (
      page: number,
      overrides?: {
        categories?: string[];
        inStockOnly?: boolean;
        ordering?: string;
      }
    ) => {
      const cats = overrides?.categories ?? selectedCategories;
      const stock = overrides?.inStockOnly ?? inStockOnly;
      const ordering = overrides?.ordering ?? sort;
      const params: Record<string, unknown> = {
        page_size: PAGE_SIZE,
        page,
      };
      if (query.trim()) params.search = query.trim();
      if (cats.length) params.categories = cats;
      if (ordering) params.ordering = ordering;
      if (stock) params.in_stock = true;
      return params;
    },
    [query, selectedCategories, sort, inStockOnly]
  );

  const syncUrl = useCallback(
    (overrides?: { categories?: string[]; inStockOnly?: boolean; sort?: string }) => {
      const p = new URLSearchParams();
      if (query.trim()) p.set("q", query.trim());
      const sortVal = overrides?.sort ?? sort;
      const cats = overrides?.categories ?? selectedCategories;
      const stock = overrides?.inStockOnly ?? inStockOnly;
      if (sortVal) p.set("sort", sortVal);
      if (cats.length) p.set("categories", cats.join(","));
      if (stock) p.set("in_stock", "1");
      const qs = p.toString();
      const url = qs ? `/products/search?${qs}` : "/products/search";
      router.replace(url, { scroll: false });
    },
    [query, sort, selectedCategories, inStockOnly, router]
  );

  const doSearch = useCallback(
    (resetPage = true) => {
      const page = 1;
      setSearched(true);
      if (resetPage) {
        setNextPage(1);
        setLoading(true);
      }
      setError(null);
      const params = buildParams(page);
      productApi
        .list(params)
        .then((res) => {
          setProducts((res.results ?? []).map(mapProductToCardData));
          setTotalCount(res.count ?? res.results?.length ?? 0);
          setNextPage(res.next ? page + 1 : null);
          syncUrl();
        })
        .catch((err) => {
          console.error("Product search error:", err);
          setError("خطا در جستجو. لطفا دوباره تلاش کنید.");
          setProducts([]);
          setNextPage(null);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [query, selectedCategories, inStockOnly, buildParams, syncUrl]
  );

  const loadMore = useCallback(() => {
    if (!nextPage || loadingMore || loading) return;
    setLoadingMore(true);
    productApi
      .list(buildParams(nextPage))
      .then((res) => {
        const next = (res.results ?? []).map(mapProductToCardData);
        setProducts((prev) => [...prev, ...next]);
        setTotalCount(res.count ?? 0);
        setNextPage(res.next ? nextPage + 1 : null);
      })
      .catch(() => setNextPage(null))
      .finally(() => setLoadingMore(false));
  }, [nextPage, loadingMore, loading, buildParams]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const searchParamsKey = searchParams?.toString() ?? "";

  useEffect(() => {
    setQuery(initialQuery);
    setSelectedCategories(initialCategories);
    setInStockOnly(initialInStock);
    setSort(initialSort);
    setSearched(true);
    setNextPage(1);
    setLoading(true);
    setError(null);
    const params: Record<string, unknown> = {
      page_size: PAGE_SIZE,
      page: 1,
    };
    if (initialQuery.trim()) params.search = initialQuery.trim();
    if (initialCategories.length) params.categories = initialCategories;
    if (initialSort) params.ordering = initialSort;
    if (initialInStock) params.in_stock = true;
    productApi
      .list(params)
      .then((res) => {
        setProducts((res.results ?? []).map(mapProductToCardData));
        setTotalCount(res.count ?? res.results?.length ?? 0);
        setNextPage(res.next ? 2 : null);
      })
      .catch((err) => {
        console.error("Product search error:", err);
        setError("خطا در جستجو. لطفا دوباره تلاش کنید.");
        setProducts([]);
        setNextPage(null);
      })
      .finally(() => setLoading(false));
  }, [searchParamsKey]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(true);
  };

  const handleSortChange = (event: { target: { value: string } }) => {
    const v = event.target.value;
    setSort(v);
    setNextPage(1);
    setLoading(true);
    setError(null);
    productApi
      .list(buildParams(1, { ordering: v }))
      .then((res) => {
        setProducts((res.results ?? []).map(mapProductToCardData));
        setTotalCount(res.count ?? res.results?.length ?? 0);
        setNextPage(res.next ? 2 : null);
        syncUrl({ sort: v });
      })
      .catch(() => {
        setError("خطا در بارگذاری.");
        setProducts([]);
      })
      .finally(() => setLoading(false));
  };

  const handleCategoryToggle = (id: string) => {
    const next = selectedCategories.includes(id)
      ? selectedCategories.filter((c) => c !== id)
      : [...selectedCategories, id];
    setSelectedCategories(next);
    setSearched(true);
    setNextPage(1);
    setLoading(true);
    setError(null);
    productApi
      .list(buildParams(1, { categories: next }))
      .then((res) => {
        setProducts((res.results ?? []).map(mapProductToCardData));
        setTotalCount(res.count ?? res.results?.length ?? 0);
        setNextPage(res.next ? 2 : null);
        syncUrl({ categories: next });
      })
      .catch(() => {
        setError("خطا در بارگذاری.");
        setProducts([]);
      })
      .finally(() => setLoading(false));
  };

  const handleInStockChange = (v: boolean) => {
    setInStockOnly(v);
    setSearched(true);
    setNextPage(1);
    setLoading(true);
    setError(null);
    productApi
      .list(buildParams(1, { inStockOnly: v }))
      .then((res) => {
        setProducts((res.results ?? []).map(mapProductToCardData));
        setTotalCount(res.count ?? res.results?.length ?? 0);
        setNextPage(res.next ? 2 : null);
        syncUrl({ inStockOnly: v });
      })
      .catch(() => {
        setError("خطا در بارگذاری.");
        setProducts([]);
      })
      .finally(() => setLoading(false));
  };

  const applyFilters = () => {
    setFilterDrawerOpen(false);
    doSearch(true);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setInStockOnly(false);
    setSort("");
    setNextPage(1);
    setSearched(true);
    setLoading(true);
    setError(null);
    syncUrl({ categories: [], inStockOnly: false, sort: "" });
    productApi
      .list(buildParams(1, { categories: [], inStockOnly: false, ordering: "" }))
      .then((res) => {
        setProducts((res.results ?? []).map(mapProductToCardData));
        setTotalCount(res.count ?? res.results?.length ?? 0);
        setNextPage(res.next ? 2 : null);
      })
      .catch(() => {
        setError("خطا در بارگذاری.");
        setProducts([]);
      })
      .finally(() => setLoading(false));
  };

  const handleAddToBasket = async (productId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(pathname ?? "/")}`);
      return;
    }
    setAddingProductId(productId);
    try {
      await basketApi.addItem(productId, null, 1);
    } catch (err) {
      console.error("Add to basket error:", err);
    } finally {
      setAddingProductId(null);
    }
  };

  const filterSidebarContent = (
    <FilterSidebar
      categories={categories}
      selectedCategories={selectedCategories}
      inStockOnly={inStockOnly}
      onCategoryToggle={handleCategoryToggle}
      onInStockChange={handleInStockChange}
      onClear={clearFilters}
      hasActiveFilters={hasActiveFilters}
      disabled={loading}
    />
  );

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
      {/* Loading progress bar - fixed, no layout shift */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          visibility: loading ? "visible" : "hidden",
          opacity: loading ? 1 : 0,
          transition: "opacity 0.2s, visibility 0.2s",
        }}
      >
        <LinearProgress color="primary" sx={{ height: 3 }} />
      </Box>

     

      {/* Toolbar: sort + filter (mobile) */}
      {searched && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
            {loading ? "در حال جستجو..." : `${totalCount} محصول${query.trim() ? ` برای «${query.trim()}»` : ""}`}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 160 }} disabled={loading}>
              <InputLabel>مرتب‌سازی</InputLabel>
              <Select
                value={sort}
                label="مرتب‌سازی"
                onChange={handleSortChange}
                sx={{ borderRadius: 2 }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value || "default"} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<SlidersHorizontal size={18} />}
              onClick={() => setFilterDrawerOpen(true)}
              disabled={loading}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                display: { xs: "inline-flex", md: "none" },
              }}
            >
              فیلتر
              {hasActiveFilters && (
                <Chip
                  label={selectedCategories.length + (inStockOnly ? 1 : 0)}
                  size="small"
                  sx={{ ml: 0.5, height: 20, fontSize: "0.75rem" }}
                />
              )}
            </Button>
          </Stack>
        </Stack>
      )}

      <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
        {/* Sidebar - desktop */}
        <Box
          sx={{
            width: 260,
            flexShrink: 0,
            display: { xs: "none", md: "block" },
          }}
        >
          {categoriesLoading ? (
            <Stack spacing={1}>
              <Skeleton variant="rounded" height={40} />
              <Skeleton variant="rounded" height={200} />
            </Stack>
          ) : (
            filterSidebarContent
          )}
        </Box>

        {/* Results - minHeight prevents layout jump when content changes */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            position: "relative",
            minHeight: { xs: 400, sm: 500, md: 560 },
          }}
        >
          {loading && products.length === 0 ? (
            <Fade in timeout={200}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                  },
                  gap: 2.5,
                }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </Box>
            </Fade>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !searched ? (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                borderRadius: 3,
                border: "1px dashed",
                borderColor: "divider",
                bgcolor: "grey.50",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Search size={56} style={{ color: "var(--mui-palette-text-secondary)", opacity: 0.6 }} />
              </Box>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                عبارت جستجو را وارد کنید یا از فیلتر دسته‌بندی استفاده کنید.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                جستجو با فیلتر و مرتب‌سازی و بارگذاری تدریجی پشتیبانی می‌شود.
              </Typography>
            </Box>
          ) : products.length === 0 ? (
            <Alert severity="info" icon={<Package size={24} />}>
              محصولی با این معیارها یافت نشد. فیلترها را تغییر دهید یا عبارت جستجو را عوض کنید.
            </Alert>
          ) : (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                  },
                  gap: 2.5,
                }}
              >
                {products.map((product) => (
                  <ProductSearchCard
                    key={product.id}
                    product={product}
                    onAddToBasket={handleAddToBasket}
                    isAddingToBasket={addingProductId === product.id}
                  />
                ))}
              </Box>
              <Box ref={loadMoreRef} sx={{ py: 3, display: "flex", justifyContent: "center" }}>
                {loadingMore && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
                    <Typography variant="body2">در حال بارگذاری...</Typography>
                  </Stack>
                )}
                {!loadingMore && nextPage && products.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    با اسکرول بیشتر بارگذاری می‌شود
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Mobile filter drawer */}
      <Drawer
        anchor="left"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: { width: "min(320px, 100vw)", p: 2 },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">فیلتر محصولات</Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)}>
            <X size={20} />
          </IconButton>
        </Stack>
        {categoriesLoading ? (
          <Skeleton variant="rounded" height={200} />
        ) : (
          <>
            {filterSidebarContent}
            <Button
              variant="contained"
              fullWidth
              onClick={applyFilters}
              sx={{ mt: 3, borderRadius: 2, py: 1.5 }}
            >
              اعمال فیلتر
            </Button>
          </>
        )}
      </Drawer>

      <Box sx={{ mt: 4 }}>
        <Button
          component={Link}
          href="/products"
          variant="outlined"
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          بازگشت به لیست محصولات
        </Button>
      </Box>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </Container>
  );
}
