"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  CardMedia,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import {
  Package,
  ArrowRight,
  MapPin,
  Truck,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { orderApi, type Order, type OrderAddress } from "@/lib/api/orderApi";
import type { WidgetConfig } from "@/themes/types";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fa-IR").format(price);
};

const ensureNumber = (v: unknown): number => {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
};

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شده",
  processing: "در حال آماده‌سازی",
  completed: "تکمیل شده",
  delivered: "تحویل داده شده",
  cancelled: "لغو شده",
  failed: "ناموفق",
};

const STATUS_COLORS: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  pending: "warning",
  paid: "info",
  processing: "primary",
  completed: "success",
  delivered: "success",
  cancelled: "default",
  failed: "error",
};

const formatVariantAttributes = (attributeValues: unknown[]): string => {
  if (!Array.isArray(attributeValues) || attributeValues.length === 0) return "";
  return attributeValues
    .map((av: unknown) => {
      const a = av as { attribute?: { title?: string }; value?: { title?: string } };
      return a?.value?.title ? `${a.attribute?.title ?? ""}: ${a.value.title}` : "";
    })
    .filter(Boolean)
    .join(" • ");
};

type OrderItemWithProduct = Order["items"][number] & {
  product?: { id?: string; title?: string; main_image?: { file?: string } };
  variant?: { main_image?: { file?: string }; attribute_values?: unknown[] };
};

function formatAddress(addr: string | OrderAddress): string {
  if (typeof addr === "string") return addr;
  const parts: string[] = [];
  if (addr.recipient_fullname) parts.push(addr.recipient_fullname);
  if (addr.phone_number) parts.push(addr.phone_number);
  if (addr.address_line1) parts.push(addr.address_line1);
  const cityName = typeof addr.city === "object" && addr.city?.name ? addr.city.name : "";
  const provinceName = typeof addr.province === "object" && addr.province?.name ? addr.province.name : "";
  if (cityName || provinceName) parts.push([cityName, provinceName].filter(Boolean).join("، "));
  if (addr.postcode) parts.push(`کد پستی: ${addr.postcode}`);
  return parts.join(" - ");
}

function getShippingMethodName(sm: string | { id: string; name: string }): string {
  if (typeof sm === "object" && sm?.name) return sm.name;
  return "ارسال";
}

export default function OrderDetail({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { setData } = usePageRuntime();

  const pathParams = config?.widgetConfig?.pathParams as Record<string, string | number> | undefined;
  const orderCodeFromConfig =
    (pathParams?.id ?? pathParams?.code ?? config?.widgetConfig?.order_code ?? config?.widgetConfig?.id) as
      | string
      | number
      | undefined;
  const orderCodeFromPath = pathname?.split("/").filter(Boolean).pop();
  const orderCode = orderCodeFromConfig ?? orderCodeFromPath;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !orderCode) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await orderApi.getOrder(orderCode);
        if (isMounted) {
          setOrder(data);
          setData("order.detail", data);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Order load error:", err);
          setError("سفارش یافت نشد یا دسترسی به آن ندارید.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [isAuthenticated, orderCode]);

  const handleCancel = async () => {
    if (!order?.code || cancelling) return;
    setCancelling(true);
    try {
      await orderApi.cancelOrder(order.code);
      setOrder((prev) => prev ? { ...prev, status: "cancelled" } : null);
    } catch (err) {
      console.error("Cancel order error:", err);
      setError("خطا در لغو سفارش.");
    } finally {
      setCancelling(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, px: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", py: 8 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>لطفا برای مشاهده جزئیات سفارش وارد شوید</Typography>
          <Button
            variant="contained"
            onClick={() => router.push(`/login?next=${encodeURIComponent(pathname || "/")}`)}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            ورود به حساب کاربری
          </Button>
        </Box>
      </Container>
    );
  }

  if (!orderCode) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, px: 2 }}>
        <Alert severity="info">شماره سفارش مشخص نشده است.</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress sx={{ color: "primary.main" }} />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, px: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error ?? "سفارش یافت نشد."}</Alert>
        <Button component={Link} href="/orders" variant="outlined" startIcon={<ArrowRight size={18} />} sx={{ textTransform: "none" }}>
          بازگشت به لیست سفارشات
        </Button>
      </Container>
    );
  }

  const items = order.items as OrderItemWithProduct[];
  const productsTotal = ensureNumber(order.products_total_amount);
  const deliveryAmount = ensureNumber(order.delivery_amount);
  const payableAmount = ensureNumber(order.payable_amount);
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const statusColor = STATUS_COLORS[order.status] ?? "default";
  const canCancel = order.status === "pending";
  const addressStr = formatAddress(order.delivery_address);
  const shippingName = getShippingMethodName(order.shipping_method);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          href="/orders"
          startIcon={<ArrowRight size={18} />}
          sx={{ mb: 2, textTransform: "none" }}
        >
          بازگشت به لیست سفارشات
        </Button>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: "1.5rem", md: "1.75rem" } }}>
            سفارش #{order.code}
          </Typography>
          <Chip label={statusLabel} color={statusColor} sx={{ fontWeight: 500 }} />
          <Typography variant="body2" color="text.secondary">
            {formatDate(order.created_at)}
          </Typography>
        </Box>
      </Box>

      <Stack spacing={3} direction={{ xs: "column", md: "row" }} alignItems="stretch">
        {/* Items */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>کالاهای سفارش</Typography>
              <Stack spacing={2}>
                {items?.map((item) => {
                  const prod = item.product as { id?: string; title?: string; main_image?: { file?: string } };
                  const variant = item.variant as { main_image?: { file?: string }; attribute_values?: unknown[] } | undefined;
                  const imageUrl =
                    variant?.main_image?.file ||
                    prod?.main_image?.file ||
                    "https://via.placeholder.com/80?text=بدون+تصویر";
                  const variantLabel = variant ? formatVariantAttributes(variant.attribute_values ?? []) : "";
                  const totalPrice = ensureNumber(item.unit_price) * (item.quantity || 0);

                  return (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "grey.50",
                        alignItems: "center",
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={imageUrl}
                        alt={prod?.title ?? ""}
                        sx={{ width: 80, height: 80, borderRadius: 1, objectFit: "cover" }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Link
                          href={prod?.id ? `/product/${prod.id}` : "#"}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <Typography fontWeight={600} sx={{ "&:hover": { color: "primary.main" } }}>
                            {prod?.title ?? "محصول"}
                          </Typography>
                        </Link>
                        {variantLabel && (
                          <Typography variant="body2" color="text.secondary">{variantLabel}</Typography>
                        )}
                        <Typography variant="body2">
                          {item.quantity} × {formatPrice(ensureNumber(item.unit_price))} تومان
                        </Typography>
                      </Box>
                      <Typography fontWeight={600} sx={{ color: "primary.main" }}>
                        {formatPrice(totalPrice)} تومان
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Summary & Info */}
        <Box sx={{ width: { xs: "100%", md: 360 }, flexShrink: 0 }}>
          <Stack spacing={2}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>خلاصه سفارش</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">قیمت کالاها</Typography>
                  <Typography>{formatPrice(productsTotal)} تومان</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">هزینه ارسال ({shippingName})</Typography>
                  <Typography>{formatPrice(deliveryAmount)} تومان</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography fontWeight="bold">مبلغ قابل پرداخت</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {formatPrice(payableAmount)} تومان
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>آدرس تحویل</Typography>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <MapPin size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                  <Typography variant="body2">{addressStr || "—"}</Typography>
                </Box>
              </CardContent>
            </Card>

            {order.shipping_tracking_code && order.shipping_tracking_url && (
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>پیگیری ارسال</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Typography variant="body2">{order.shipping_tracking_code}</Typography>
                    <Button
                      href={order.shipping_tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      endIcon={<ExternalLink size={16} />}
                      sx={{ textTransform: "none" }}
                    >
                      ردیابی
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {canCancel && (
              <Button
                variant="outlined"
                color="error"
                fullWidth
                startIcon={cancelling ? <CircularProgress size={18} color="inherit" /> : <XCircle size={18} />}
                disabled={cancelling}
                onClick={handleCancel}
                sx={{ borderRadius: 2, textTransform: "none", py: 1.5 }}
              >
                {cancelling ? "در حال لغو..." : "لغو سفارش"}
              </Button>
            )}
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
