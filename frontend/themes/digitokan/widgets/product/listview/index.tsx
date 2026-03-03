"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Rating,
  Chip,
  Skeleton,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { WidgetConfig } from "@/themes/types";
import { productApi, basketApi, type Product } from "@/lib/api";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import { formatPrice, calculateDiscount, slugify } from "../../../utils/helpers";

interface ProductCardData {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  imageUrl: string;
  inStock: boolean;
  averageRating: number;
  reviewsCount: number;
}

function mapProduct(product: Product): ProductCardData {
  const sell = parseFloat(product.sell_price);
  const original = parseFloat(product.price);
  const discountPercent = calculateDiscount(original, sell);
  const imageUrl = product.main_image?.file || product.list_images?.[0]?.file || "https://via.placeholder.com/400x400?text=بدون+تصویر";
  const inStock = product.stock_unlimited || (product.stock ?? 0) > 0;
  const avgRating = product.average_rating != null ? parseFloat(String(product.average_rating)) : 0;
  const reviewsCount = product.reviews_count ?? 0;

  return {
    id: product.id,
    title: product.title,
    price: sell,
    originalPrice: original,
    discountPercent,
    imageUrl,
    inStock,
    averageRating: avgRating,
    reviewsCount,
  };
}

function ProductCard({
  product,
  onAddToBasket,
  adding,
}: {
  product: ProductCardData;
  onAddToBasket: (id: string) => void;
  adding: boolean;
}) {
  const hasDiscount = product.originalPrice > product.price;
  const url = `/product/${product.id}/${slugify(product.title)}`;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "all 0.3s",
        "&:hover": {
          boxShadow: 6,
          transform: "translateY(-4px)",
        },
      }}
    >
      {hasDiscount && (
        <Chip
          label={`${product.discountPercent}%`}
          color="error"
          size="small"
          sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
        />
      )}

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
          <Chip label="ناموجود" color="error" />
        </Box>
      )}

      <Link href={url} style={{ textDecoration: "none", color: "inherit" }}>
        <CardMedia
          component="img"
          image={product.imageUrl}
          alt={product.title}
          sx={{
            height: 240,
            objectFit: "contain",
            p: 2,
            bgcolor: "grey.50",
          }}
        />
      </Link>

      <CardContent sx={{ flexGrow: 1 }}>
        <Link href={url} style={{ textDecoration: "none", color: "inherit" }}>
          <Typography
            variant="body2"
            gutterBottom
            sx={{
              fontWeight: "medium",
              height: 40,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              "&:hover": { color: "primary.main" },
            }}
          >
            {product.title}
          </Typography>
        </Link>

        {product.reviewsCount > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
            <Rating value={product.averageRating} readOnly size="small" />
            <Typography variant="caption" color="text.secondary">
              ({product.reviewsCount})
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
          {hasDiscount && (
            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through", display: "block" }}>
              {formatPrice(product.originalPrice)}
            </Typography>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {formatPrice(product.price)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              تومان
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton size="small" color="default">
            <FavoriteIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="default" component={Link} href={url}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Box>
        <IconButton
          size="small"
          color="primary"
          disabled={!product.inStock || adding}
          onClick={() => onAddToBasket(product.id)}
          sx={{
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.dark" },
            "&:disabled": { bgcolor: "grey.300" },
          }}
        >
          <AddShoppingCartIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
}

export default function ProductListView({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data } = usePageRuntime();

  const title = (config?.widgetConfig?.title as string) || "منتخب محصولات";
  const subtitle = (config?.widgetConfig?.subtitle as string) || "بهترین کالاها با بالاترین کیفیت";
  const pageSize = Number(config?.widgetConfig?.page_size ?? 8) || 8;

  const ssrList = (data?.product as Record<string, unknown>)?.["listview"] as { results?: Product[] } | undefined;
  const ssrProducts = ssrList?.results ?? [];

  const [loading, setLoading] = useState(!ssrProducts.length);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductCardData[]>(() =>
    ssrProducts.length ? ssrProducts.map(mapProduct) : []
  );
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (ssrProducts.length > 0) {
      setLoading(false);
      return;
    }
    
    let mounted = true;
    setLoading(true);
    setError(null);
    
    productApi
      .list({ page_size: pageSize })
      .then((res) => {
        if (!mounted) return;
        const items = (res.results ?? []).map(mapProduct);
        setProducts(items);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setError("خطا در بارگذاری محصولات");
      })
      .finally(() => mounted && setLoading(false));
      
    return () => {
      mounted = false;
    };
  }, [pageSize, ssrProducts.length]);

  const addToBasket = async (id: string) => {
    if (!isAuthenticated) {
      const current = `${pathname ?? ""}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
      router.push(`/login?next=${encodeURIComponent(current)}`);
      return;
    }
    
    setAddingId(id);
    try {
      await basketApi.addItem(id, null, 1);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>

      {loading ? (
        <Grid container spacing={3}>
          {[...Array(pageSize)].map((_, idx) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
              <Card>
                <Skeleton variant="rectangular" height={240} />
                <CardContent>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Card sx={{ p: 3, textAlign: "center" }}>
          <Typography color="error">{error}</Typography>
        </Card>
      ) : products.length === 0 ? (
        <Card sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">محصولی یافت نشد</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {products.map((p) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
              <ProductCard product={p} onAddToBasket={addToBasket} adding={addingId === p.id} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
