"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Typography,
  Container,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  Chip,
} from "@mui/material";
import { ArrowRight } from "lucide-react";
import { productApi, type Product } from "@/lib/api";
import type { WidgetConfig } from "@/themes/types";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fa-IR").format(price);
};

export default function ProductsDetail({ config }: { config?: WidgetConfig }) {
  const pathname = usePathname();
  const { data, setData } = usePageRuntime();
  const pathParams = config?.widgetConfig?.pathParams as Record<string, string | number> | undefined;
  const idFromConfig = (pathParams?.id ?? pathParams?.code ?? config?.widgetConfig?.id) as
    | string
    | number
    | undefined;
  const idFromPath = pathname?.split("/").filter(Boolean)[1];
  const id = idFromConfig ?? idFromPath;

  // Use pre-fetched SSR data if available
  const ssrProduct = (data?.product as Record<string, unknown>)?.["detail"] as Product | undefined;

  const [product, setProduct] = useState<Product | null>(ssrProduct ?? null);
  const [loading, setLoading] = useState(!ssrProduct);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    if (ssrProduct && String(ssrProduct.id) === String(id)) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);
    setError(null);
    productApi
      .get(id)
      .then((fetched) => {
        if (isMounted) {
          setProduct(fetched);
          setData("product.detail", fetched);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Product detail error:", err);
          setError(tFrontendAuto("fe.51cdbb0c893c"));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id, ssrProduct]);

  if (!id) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, px: 2 }}>
        <Alert severity="info">{tFrontendAuto("fe.064b218af17a")}</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, px: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error ?? "محصول یافت نشد."}
        </Alert>
        <Button
          component={Link}
          href="/"
          variant="outlined"
          startIcon={<ArrowRight size={18} />}
          sx={{ textTransform: "none" }}
        >
          بازگشت به فروشگاه
        </Button>
      </Container>
    );
  }

  const sellPrice = parseFloat(product.sell_price);
  const originalPrice = parseFloat(product.price);
  const hasDiscount = originalPrice > sellPrice;
  const imageUrl =
    product.main_image?.file ||
    product.list_images?.[0]?.file ||
    "https://via.placeholder.com/600x600?text=بدون+تصویر";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
      <Button
        component={Link}
        href="/"
        startIcon={<ArrowRight size={18} />}
        sx={{ mb: 3 }}
      >
        بازگشت به فروشگاه
      </Button>

      <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems="stretch">
        <Box sx={{ flex: { md: "0 0 400px" }, minWidth: 0 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", height: "100%" }}>
            <CardMedia
              component="img"
              image={imageUrl}
              alt={product.title}
              sx={{ aspectRatio: "1", objectFit: "cover" }}
            />
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 2, fontSize: { xs: "1.5rem", md: "1.75rem" } }}>
            {product.title}
          </Typography>

          {(product.average_rating != null && (product.reviews_count ?? 0) > 0) ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                ★ {parseFloat(String(product.average_rating)).toFixed(1)} ({product.reviews_count} نظر)
              </Typography>
            </Stack>
          ) : null}

          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight="bold" color="primary.main">
              {formatPrice(sellPrice)} تومان
            </Typography>
            {hasDiscount && (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                  {formatPrice(originalPrice)}
                </Typography>
                <Chip
                  label={`${Math.round(((originalPrice - sellPrice) / originalPrice) * 100)}% تخفیف`}
                  color="error"
                  size="small"
                />
              </>
            )}
          </Stack>

          {product.short_description && (
            <Typography variant="body1" sx={{ mb: 3 }} color="text.secondary">
              {product.short_description}
            </Typography>
          )}

          <Box
            className="product-description prose max-w-none"
            sx={{
              "& img": { maxWidth: "100%", height: "auto", borderRadius: 2 },
              "& a": { color: "primary.main" },
              fontSize: "1rem",
              lineHeight: 1.8,
            }}
            dangerouslySetInnerHTML={{ __html: product.description || "" }}
          />

          <Box sx={{ mt: 6, pt: 4, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="h6" sx={{ mb: 3 }}>{tFrontendAuto("fe.8dc079691c98")}</Typography>
            <ProductReviews
              productId={product.id}
              product={product}
              variant="default"
              onReviewSubmitted={() => productApi.get(id!).then(setProduct)}
            />
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}
