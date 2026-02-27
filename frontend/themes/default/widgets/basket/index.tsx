"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { basketApi, type Basket, type BasketItem } from "@/lib/api/basketApi";
import type { WidgetConfig } from "@/themes/types";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";

// Helper function to format price in Persian (matches products listview)
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fa-IR").format(price);
};

// Ensure we handle both number and string from API (Django DecimalField)
const ensureNumber = (v: unknown): number => {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
};

// Format variant attributes for display
const formatVariantAttributes = (attributeValues: unknown[]): string => {
  if (!Array.isArray(attributeValues) || attributeValues.length === 0) return "";
  return attributeValues
    .map((av: unknown) => {
      const a = av as { attribute?: { title?: string }; value?: { title?: string } };
      const attr = a?.attribute?.title ?? "";
      const val = a?.value?.title ?? "";
      return val ? `${attr}: ${val}` : "";
    })
    .filter(Boolean)
    .join(" • ");
};

function BasketItemCard({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating,
}: {
  item: BasketItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  isUpdating: boolean;
}) {
  const product = item.product_details;
  const variant = item.variant_details;
  const imageUrl =
    variant?.main_image?.file ||
    product.main_image?.file ||
    product.list_images?.[0]?.file ||
    "https://via.placeholder.com/150?text=بدون+تصویر";
  const unitPrice = ensureNumber(item.unit_price);
  const totalPrice = ensureNumber(item.total_price);
  const variantLabel = variant
    ? formatVariantAttributes((variant as { attribute_values?: unknown[] })?.attribute_values ?? []) ||
      (variant ? "مدل: " + (variant.id?.slice(0, 8) ?? "") + "..." : "")
    : "";
  const productPath = `/product/${product.id}`;

  return (
    <Card
      className="group transition-all duration-300 hover:shadow-xl"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
      }}
      variant="outlined"
    >
      <Box className="p-4 flex flex-col sm:flex-row gap-4">
        <Link href={productPath} className="flex-shrink-0 block">
          <CardMedia
            component="img"
            image={imageUrl}
            alt={product.title}
            sx={{
              width: { xs: "100%", sm: 120 },
              height: { xs: 180, sm: 120 },
              borderRadius: 2,
              objectFit: "cover",
              transition: "transform 0.3s",
              "&:hover": { transform: "scale(1.03)" },
            }}
          />
        </Link>
        <Box className="flex-1 flex flex-col justify-between min-w-0">
          <Box>
            <Link href={productPath} className="no-underline">
              <Typography
                variant="h6"
                component="h3"
                fontWeight={600}
                className="line-clamp-2 hover:text-primary.main transition-colors"
                sx={{
                  color: "text.primary",
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                }}
              >
                {product.title}
              </Typography>
            </Link>
            {variantLabel && (
              <Typography
                variant="body2"
                color="text.secondary"
                className="mt-1"
                sx={{ fontSize: "0.875rem" }}
              >
                {variantLabel}
              </Typography>
            )}
          </Box>

          <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
            <Box
              className="flex items-center border rounded-lg"
              sx={{
                borderColor: "grey.300",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <IconButton
                size="small"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                disabled={isUpdating}
                sx={{
                  "&:hover": { bgcolor: "primary.light", color: "white" },
                }}
              >
                <Plus size={18} />
              </IconButton>
              <Typography className="px-3 min-w-[36px] text-center" variant="body1">
                {isUpdating ? <CircularProgress size={18} /> : item.quantity}
              </Typography>
              <IconButton
                size="small"
                onClick={() => {
                  if (item.quantity > 1) {
                    onUpdateQuantity(item.id, item.quantity - 1);
                  } else {
                    onRemove(item.id);
                  }
                }}
                disabled={isUpdating}
                sx={{
                  "&:hover .trash-icon": { color: "error.main" },
                }}
              >
                {item.quantity === 1 ? (
                  <Trash2 size={18} className="trash-icon text-red-500" />
                ) : (
                  <Minus size={18} />
                )}
              </IconButton>
            </Box>

            <Box className="flex items-center gap-2">
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  color: "primary.main",
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                }}
              >
                {formatPrice(totalPrice)} تومان
              </Typography>
              {item.quantity > 1 && (
                <Typography variant="caption" color="text.secondary">
                  ({formatPrice(unitPrice)} × {item.quantity})
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

export default function BasketWidget({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [basket, setBasket] = useState<Basket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchBasket = async () => {
      try {
        setLoading(true);
        const data = await basketApi.get();
        if (isMounted) {
          setBasket(data ?? null);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching basket:", err);
          setError("خطا در دریافت سبد خرید. لطفا دوباره تلاش کنید.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBasket();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (updatingItems.has(itemId)) return;

    try {
      setUpdatingItems((prev) => new Set(prev).add(itemId));
      const updatedBasket = await basketApi.updateItem(itemId, newQuantity);
      setBasket(updatedBasket);
    } catch (err) {
      console.error("Error updating item:", err);
      setError("خطا در به‌روزرسانی تعداد. لطفا دوباره تلاش کنید.");
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (updatingItems.has(itemId)) return;

    try {
      setUpdatingItems((prev) => new Set(prev).add(itemId));
      const updatedBasket = await basketApi.removeItem(itemId);
      setBasket(updatedBasket);
    } catch (err) {
      console.error("Error removing item:", err);
      setError("خطا در حذف آیتم. لطفا دوباره تلاش کنید.");
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, px: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            py: 8,
            px: 2,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "grey.100",
              color: "grey.500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <ShoppingBag size={48} />
          </Box>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
            لطفا برای مشاهده سبد خرید وارد شوید
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            با ورود به حساب کاربری، سبد خرید شما ذخیره می‌شود
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<ShoppingCart size={20} />}
            onClick={() => router.push(`/login?next=/basket`)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              py: 1.5,
              px: 4,
            }}
          >
            ورود به حساب کاربری
          </Button>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress sx={{ color: "primary.main" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, px: 2 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!basket || basket.items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, px: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            py: 8,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "grey.100",
              color: "grey.500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <ShoppingBag size={48} />
          </Box>
          <Typography variant="h5" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>
            سبد خرید شما خالی است
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            محصولات مورد نظر خود را به سبد خرید اضافه کنید
          </Typography>
          <Button
            variant="outlined"
            size="large"
            startIcon={<ArrowRight size={20} />}
            onClick={() => router.push("/")}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              py: 1.5,
              px: 4,
            }}
          >
            بازگشت به فروشگاه
          </Button>
        </Box>
      </Container>
    );
  }

  const totalPrice = ensureNumber(basket.total_price);
  const totalItems = basket.total_items ?? basket.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
      {/* Header - matches products listview */}
      <Box sx={{ mb: { xs: 4, md: 6 } }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: "bold",
            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
          }}
        >
          سبد خرید
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {totalItems} قلم کالا در سبد شما
        </Typography>
      </Box>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={4}
        alignItems="stretch"
        sx={{ gap: { xs: 3, md: 4 } }}
      >
        {/* Items List */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={3}>
            {basket.items.map((item) => (
              <BasketItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
                isUpdating={updatingItems.has(item.id)}
              />
            ))}
          </Stack>
        </Box>

        {/* Summary Card - matches products design system */}
        <Box sx={{ width: { xs: "100%", md: 360 }, flexShrink: 0 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              position: { md: "sticky" },
              top: { md: 100 },
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                خلاصه سفارش
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  قیمت کالاها ({totalItems})
                </Typography>
                <Typography fontWeight={500}>
                  {formatPrice(totalPrice)} تومان
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  هزینه ارسال
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  وابسته به آدرس
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography fontWeight="bold">جمع سبد خرید</Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    color: "primary.main",
                    fontSize: "1.25rem",
                  }}
                >
                  {formatPrice(totalPrice)} تومان
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.5,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                  "&:hover": {
                    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                  },
                }}
                onClick={() => {
                  router.push("/checkout");
                }}
              >
                ادامه فرآیند خرید
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Container>
  );
}
