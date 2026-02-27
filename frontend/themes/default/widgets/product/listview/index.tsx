"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Rating,
  Stack,
  Container,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Heart,
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, FreeMode } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { productApi, basketApi, type Product } from "@/lib/api";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";

// Helper function to format price in Persian
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fa-IR").format(price);
};

// Slugify for SEO-friendly product URLs (handles Persian & English)
const slugify = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "product";
};

// Map API Product to component format
type ProductCardData = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  badge: string | null;
};

const mapProductToCardData = (product: Product): ProductCardData => {
  const sellPrice = parseFloat(product.sell_price);
  const originalPrice = parseFloat(product.price);
  const hasDiscount = originalPrice > sellPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - sellPrice) / originalPrice) * 100 * 10) / 10
    : 0;

  // Get image URL from main_image or use placeholder
  const imageUrl =
    product.main_image?.file ||
    product.list_images?.[0]?.file ||
    "https://via.placeholder.com/400x400?text=بدون+تصویر";

  const inStock = product.stock_unlimited || (product.stock ?? 0) > 0;
  // Determine badge based on product data
  let badge: string | null = null;
  if (!inStock) {
    badge = null; // Will show "ناموجود" overlay instead
  } else if (product.soled > 10) {
    badge = "پرفروش";
  } else if (discountPercent > 15) {
    badge = "تخفیف ویژه";
  }

  const avgRating = product.average_rating != null
    ? parseFloat(String(product.average_rating))
    : 0;
  const reviewsCount = product.reviews_count ?? 0;

  return {
    id: product.id,
    name: product.title,
    price: sellPrice,
    originalPrice: originalPrice,
    discount: discountPercent,
    image: imageUrl,
    rating: avgRating || 4.5,
    reviews: reviewsCount,
    inStock,
    badge,
  };
};

interface ProductCardProps {
  product: ProductCardData;
  onFavoriteToggle: (id: string) => void;
  onAddToBasket: (productId: string) => void;
  favoriteIds: Set<string>;
  isAddingToBasket: boolean;
}

function ProductCard({ product, onFavoriteToggle, onAddToBasket, favoriteIds, isAddingToBasket }: ProductCardProps) {
  const isFavorite = favoriteIds.has(product.id);
  const hasDiscount = product.originalPrice > product.price;
  const productUrl = `/product/${product.id}/${slugify(product.name)}`;

  return (
    <Card
      className="group relative h-full flex flex-col"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        height: "100%",
        mx: 1,
        border: "1px solid",
        borderColor: "grey.200",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
          transform: "translateY(-4px)",
          borderColor: "grey.300",
        },
      }}
    >
      <Link
        href={productUrl}
        style={{ textDecoration: "none", color: "inherit", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        {/* Image section - clickable */}
        <Box sx={{ position: "relative", overflow: "hidden", bgcolor: "grey.50", aspectRatio: "1" }}>
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
          {/* Badges overlay */}
          <Stack direction="row" spacing={0.75} sx={{ position: "absolute", top: 12, insetInlineStart: 12, insetInlineEnd: 12, zIndex: 2 }}>
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
          {/* Favorite - overlay on image */}
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFavoriteToggle(product.id);
            }}
            aria-label={isFavorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
            sx={{
              position: "absolute",
              bottom: 12,
              insetInlineEnd: 12,
              zIndex: 2,
              bgcolor: "rgba(255,255,255,0.95)",
              width: 40,
              height: 40,
              opacity: 0,
              transition: "opacity 0.2s, transform 0.2s",
              "&:hover": { bgcolor: "white", transform: "scale(1.05)" },
              ".group:hover &": { opacity: 1 },
            }}
          >
            <Heart size={20} className={isFavorite ? "text-red-500 fill-red-500" : ""} />
          </IconButton>
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
              <Chip label="ناموجود" sx={{ bgcolor: "error.main", color: "white", fontWeight: 600 }} />
            </Box>
          )}
        </Box>

        {/* Content - clickable */}
        <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2.5, pt: 2, pb: 2 }}>
          <Typography
            variant="h6"
            component="h3"
            className="line-clamp-2"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "0.95rem", sm: "1rem" },
              color: "text.primary",
              lineHeight: 1.5,
              mb: 1.5,
              minHeight: 48,
            }}
          >
            {product.name}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <Rating
              value={product.rating}
              precision={0.1}
              readOnly
              size="small"
              sx={{ "& .MuiRating-iconFilled": { color: "warning.main" } }}
            />
            <Typography variant="caption" color="text.secondary">
              ({product.reviews})
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap" sx={{ mt: "auto" }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                fontSize: { xs: "1rem", sm: "1.15rem" },
              }}
            >
              {formatPrice(product.price)}
            </Typography>
            <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
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

      {/* Add to basket - not part of link, stops propagation */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          size="medium"
          startIcon={isAddingToBasket ? <CircularProgress size={18} color="inherit" /> : <ShoppingCart size={18} />}
          aria-label="افزودن به سبد خرید"
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
          {isAddingToBasket ? "در حال افزودن..." : "افزودن به سبد"}
        </Button>
      </Box>
    </Card>
  );
}

export default function ProductsListView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data } = usePageRuntime();

  const ssrList = (data?.product as Record<string, unknown>)?.["listview"] as { results?: Product[] } | undefined;
  const ssrProducts = ssrList?.results ?? [];

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<ProductCardData[]>(() =>
    ssrProducts.length ? ssrProducts.map(mapProductToCardData) : []
  );
  const [loading, setLoading] = useState(!ssrProducts.length);
  const [error, setError] = useState<string | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  // Fetch products from API (skip if SSR data available)
  useEffect(() => {
    if (ssrProducts.length > 0) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);
    setError(null);

    productApi
      .list()
      .then((response) => {
        if (!isMounted) {
          return;
        }
        const mappedProducts = response.results.map(mapProductToCardData);
        setProducts(mappedProducts);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }
        console.error("Error fetching products:", err);
        setError("خطا در بارگذاری محصولات. لطفا دوباره تلاش کنید.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ssrProducts.length]);

  const handleFavoriteToggle = (id: string) => {
    setFavoriteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAddToBasket = async (productId: string) => {
    if (!isAuthenticated) {
      const current = `${pathname ?? ""}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
      router.push(`/login?next=${encodeURIComponent(current)}`);
      return;
    }
    setAddingProductId(productId);
    try {
      await basketApi.addItem(productId, null, 1);
    } catch (err) {
      console.error("Error adding to basket:", err);
    } finally {
      setAddingProductId(null);
    }
  };

  const updateNavigationState = () => {
    if (swiperRef.current) {
      setIsBeginning(swiperRef.current.isBeginning);
      setIsEnd(swiperRef.current.isEnd);
    }
  };

  // Add custom styles for Swiper pagination
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .products-carousel .swiper-pagination {
        position: relative !important;
        margin-top: 1.5rem;
        bottom: 0 !important;
      }
      .products-carousel .swiper-pagination-bullet {
        width: 12px;
        height: 12px;
        background-color: var(--primary-color, #4f06e5);
        opacity: 0.3;
        transition: all 0.3s ease;
        margin: 0 4px !important;
      }
      .products-carousel .swiper-pagination-bullet-active {
        opacity: 1;
        width: 24px;
        border-radius: 6px;
      }
      .products-carousel .swiper-slide {
        height: auto;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Container maxWidth="xl" className="py-8 px-4">
      {/* Header */}
      <Box className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <Box>
          <Typography
            variant="h4"
            component="h1"
            className="mb-2"
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
            }}
          >
            محصولات
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {loading ? "در حال بارگذاری..." : `${products.length} محصول موجود است`}
          </Typography>
        </Box>

        {/* Navigation Buttons */}
        <Stack direction="row" spacing={1} className="hidden sm:flex">
          <IconButton
            onClick={() => {
              swiperRef.current?.slidePrev();
              setTimeout(updateNavigationState, 100);
            }}
            className="bg-white border border-gray-300 hover:bg-gray-50 shadow-sm transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={isBeginning}
            sx={{
              borderRadius: 2,
              "&:hover:not(.Mui-disabled)": {
                bgcolor: "action.hover",
                transform: "scale(1.1)",
              },
              "&.Mui-disabled": {
                opacity: 0.3,
              },
            }}
          >
            <ChevronRight size={24} />
          </IconButton>
          <IconButton
            onClick={() => {
              swiperRef.current?.slideNext();
              setTimeout(updateNavigationState, 100);
            }}
            className="bg-white border border-gray-300 hover:bg-gray-50 shadow-sm transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={isEnd}
            sx={{
              borderRadius: 2,
              "&:hover:not(.Mui-disabled)": {
                bgcolor: "action.hover",
                transform: "scale(1.1)",
              },
              "&.Mui-disabled": {
                opacity: 0.3,
              },
            }}
          >
            <ChevronLeft size={24} />
          </IconButton>
        </Stack>
      </Box>

      {/* Products Carousel */}
      <Box className="relative">
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : products.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            محصولی یافت نشد.
          </Alert>
        ) : (
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              updateNavigationState();
            }}
            onSlideChange={updateNavigationState}
            onReachBeginning={() => setIsBeginning(true)}
            onReachEnd={() => setIsEnd(true)}
            onFromEdge={() => {
              updateNavigationState();
            }}
            modules={[Navigation, Pagination, Autoplay, FreeMode]}
            dir="rtl"
            spaceBetween={16}
            slidesPerView={1.2}
            slidesPerGroup={1}
            freeMode={true}
            speed={600}
            grabCursor={true}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
              renderBullet: (index, className) => {
                return `<span class="${className}" style="background-color: var(--primary-color, #4f06e5); opacity: 0.3; width: 12px; height: 12px; border-radius: 50%; transition: all 0.3s;"></span>`;
              },
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
                slidesPerGroup: 2,
              },
              768: {
                slidesPerView: 2.5,
                spaceBetween: 24,
                slidesPerGroup: 2,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 24,
                slidesPerGroup: 3,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 24,
                slidesPerGroup: 4,
              },
            }}
            className="!pb-12 products-carousel"
            style={{
              paddingBottom: "3rem",
              "--swiper-pagination-color": "var(--primary-color, #4f06e5)",
            } as React.CSSProperties}
          >
            {products.map((product) => (
              <SwiperSlide key={product.id} className="!h-auto">
                <Box className="h-full">
                  <ProductCard
                    product={product}
                    onFavoriteToggle={handleFavoriteToggle}
                    onAddToBasket={handleAddToBasket}
                    favoriteIds={favoriteIds}
                    isAddingToBasket={addingProductId === product.id}
                  />
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </Box>
    </Container>
  );
}
