"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardMedia,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  Rating,
  IconButton,
  Skeleton,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import VerifiedIcon from "@mui/icons-material/Verified";
import ReplayIcon from "@mui/icons-material/Replay";
import PaymentIcon from "@mui/icons-material/Payment";
import { productApi, basketApi, type Product } from "@/lib/api";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import type { WidgetConfig } from "@/themes/types";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { formatPrice, calculateDiscount } from "../../../utils/helpers";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProductDetail({ config }: { config?: WidgetConfig }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data, setData } = usePageRuntime();
  
  const pathParams = config?.widgetConfig?.pathParams as Record<string, string | number> | undefined;
  const idFromConfig = (pathParams?.id ?? pathParams?.code ?? config?.widgetConfig?.id) as string | number | undefined;
  const idFromPath = pathname?.split("/").filter(Boolean)[1];
  const id = idFromConfig ?? idFromPath;

  const ssrProduct = (data?.product as Record<string, unknown>)?.["detail"] as Product | undefined;

  const [product, setProduct] = useState<Product | null>(ssrProduct ?? null);
  const [loading, setLoading] = useState(!ssrProduct);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

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
          setError("خطا در بارگذاری محصول");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
      
    return () => {
      isMounted = false;
    };
  }, [id, ssrProduct]);

  useEffect(() => {
    if (!product) return;
    const first = product.main_image?.file || product.list_images?.[0]?.file || null;
    setSelectedImage(first);
  }, [product]);

  const handleAddToBasket = async () => {
    if (!isAuthenticated) {
      const current = `${pathname ?? ""}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
      router.push(`/login?next=${encodeURIComponent(current)}`);
      return;
    }
    
    if (!product) return;
    
    setAdding(true);
    try {
      await basketApi.addItem(String(product.id), null, 1);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  if (!id) {
    return (
      <Container sx={{ py: 4 }}>
        <Card sx={{ p: 3 }}>
          <Typography color="text.secondary">شناسه محصول مشخص نیست</Typography>
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={40} width="60%" />
            <Skeleton variant="rectangular" height={200} sx={{ mt: 2, borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container sx={{ py: 4 }}>
        <Card sx={{ p: 3 }}>
          <Typography color="error" gutterBottom>
            {error ?? "محصول یافت نشد"}
          </Typography>
          <Button component={Link} href="/" variant="contained" sx={{ mt: 2 }}>
            بازگشت به فروشگاه
          </Button>
        </Card>
      </Container>
    );
  }

  const sellPrice = parseFloat(product.sell_price);
  const originalPrice = parseFloat(product.price);
  const hasDiscount = originalPrice > sellPrice;
  const discountPercent = calculateDiscount(originalPrice, sellPrice);

  const images = [
    product.main_image?.file,
    ...(product.list_images?.map((img) => img?.file) ?? []),
  ].filter(Boolean) as string[];

  const mainImage = selectedImage ?? images[0] ?? "https://via.placeholder.com/600x600?text=بدون+تصویر";

  return (
    <>
      {/* Breadcrumb */}
      <Box sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", py: 2 }}>
        <Container>
          <Breadcrumbs>
            <MuiLink component={Link} href="/" underline="hover" color="inherit">
              خانه
            </MuiLink>
            <MuiLink component={Link} href="/products/search" underline="hover" color="inherit">
              محصولات
            </MuiLink>
            <Typography color="text.primary">{product.title}</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Images */}
          <Grid item xs={12} md={6}>
            <Card sx={{ position: "sticky", top: 100 }}>
              <Box sx={{ position: "relative" }}>
                <CardMedia
                  component="img"
                  image={mainImage}
                  alt={product.title}
                  sx={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "contain" }}
                />
                {hasDiscount && (
                  <Chip
                    label={`${discountPercent}%`}
                    color="error"
                    size="small"
                    sx={{ position: "absolute", top: 16, right: 16 }}
                  />
                )}
              </Box>
              
              {images.length > 1 && (
                <Box sx={{ display: "flex", gap: 1, p: 2, overflowX: "auto" }}>
                  {images.slice(0, 5).map((img, idx) => (
                    <Box
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      sx={{
                        width: 80,
                        height: 80,
                        flexShrink: 0,
                        border: 2,
                        borderColor: img === mainImage ? "primary.main" : "divider",
                        borderRadius: 1,
                        overflow: "hidden",
                        cursor: "pointer",
                        "&:hover": { borderColor: "primary.main" },
                      }}
                    >
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </Box>
                  ))}
                </Box>
              )}
            </Card>
          </Grid>

          {/* Product Info */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom fontWeight="bold">
                {product.title}
              </Typography>

              {product.average_rating != null && product.reviews_count != null && product.reviews_count > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <Rating value={parseFloat(String(product.average_rating))} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary">
                    {parseFloat(String(product.average_rating)).toFixed(1)} ({product.reviews_count} نظر)
                  </Typography>
                </Box>
              )}

              {product.short_description && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {product.short_description}
                </Typography>
              )}

              {/* Price */}
              <Card variant="outlined" sx={{ p: 2, my: 3, bgcolor: "grey.50" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Chip label="موجود در انبار" color="success" size="small" />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {hasDiscount && (
                    <Typography variant="body2" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                      {formatPrice(originalPrice)}
                    </Typography>
                  )}
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {formatPrice(sellPrice)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    تومان
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleAddToBasket}
                  disabled={adding}
                  sx={{ mt: 2 }}
                >
                  {adding ? "در حال افزودن..." : "افزودن به سبد خرید"}
                </Button>

                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <IconButton size="small" sx={{ border: 1, borderColor: "divider" }}>
                    <FavoriteIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ border: 1, borderColor: "divider" }}>
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Card>

              {/* Services */}
              <Grid container spacing={2}>
                {[
                  { icon: <LocalShippingIcon />, text: "ارسال سریع" },
                  { icon: <VerifiedIcon />, text: "ضمانت اصل بودن" },
                  { icon: <ReplayIcon />, text: "۷ روز بازگشت" },
                  { icon: <PaymentIcon />, text: "پرداخت در محل" },
                ].map((service, idx) => (
                  <Grid item xs={6} key={idx}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ color: "primary.main" }}>{service.icon}</Box>
                      <Typography variant="body2">{service.text}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mt: 4 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tab label="توضیحات محصول" />
            <Tab label="مشخصات فنی" />
            <Tab label="نظرات کاربران" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: product.description || "<p>توضیحاتی وجود ندارد</p>" }} />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                مشخصات فنی
              </Typography>
              <Typography variant="body2" color="text.secondary">
                شناسه محصول: {product.id}
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 2 }}>
              <ProductReviews
                productId={product.id}
                product={product}
                variant="digitokan"
                onReviewSubmitted={() => {
                  if (id) {
                    productApi.get(id).then((p) => {
                      setProduct(p);
                      setData("product.detail", p);
                    });
                  }
                }}
              />
            </Box>
          </TabPanel>
        </Card>
      </Container>
    </>
  );
}
