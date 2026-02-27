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
  Button,
  Stack,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import {
  Package,
  ChevronLeft,
  XCircle,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { orderApi, type Order } from "@/lib/api/orderApi";
import type { WidgetConfig } from "@/themes/types";
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

type OrderItemWithProduct = Order["items"][number] & {
  product?: { title?: string; main_image?: { file?: string } };
  variant?: { main_image?: { file?: string } };
};

function OrderCard({
  order,
  onCancel,
  isCancelling,
}: {
  order: Order;
  onCancel: (code: number) => void;
  isCancelling: boolean;
}) {
  const router = useRouter();
  const items = order.items as OrderItemWithProduct[];
  const firstItem = items?.[0];
  const imageUrl =
    firstItem?.variant?.main_image?.file ||
    (firstItem?.product as { main_image?: { file?: string } })?.main_image?.file ||
    "https://via.placeholder.com/120?text=بدون+تصویر";
  const itemsCount = items?.reduce((s, i) => s + (i.quantity || 0), 0) ?? 0;
  const payableAmount = ensureNumber(order.payable_amount);
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const statusColor = STATUS_COLORS[order.status] ?? "default";
  const canCancel = order.status === "pending";

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        transition: "box-shadow 0.3s",
        "&:hover": { boxShadow: 2 },
      }}
    >
      <Box className="p-4 flex flex-col sm:flex-row gap-4">
        <Link
          href={order.code != null ? `/order/${order.code}` : "#"}
          className="flex-shrink-0 block"
          style={{ textDecoration: "none" }}
        >
          <CardMedia
            component="img"
            image={imageUrl}
            alt="سفارش"
            sx={{
              width: { xs: "100%", sm: 120 },
              height: { xs: 140, sm: 120 },
              borderRadius: 2,
              objectFit: "cover",
            }}
          />
        </Link>
        <Box className="flex-1 flex flex-col gap-2 min-w-0">
          <Box className="flex flex-wrap items-center gap-2">
            <Link
              href={order.code != null ? `/order/${order.code}` : "#"}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{
                  color: "text.primary",
                  "&:hover": { color: "primary.main" },
                }}
              >
                سفارش #{order.code}
              </Typography>
            </Link>
            <Chip
              label={statusLabel}
              color={statusColor}
              size="small"
              sx={{ fontWeight: 500 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {formatDate(order.created_at)}
          </Typography>
          <Box className="flex flex-wrap items-center gap-2">
            <Typography variant="body2">
              {itemsCount} قلم کالا
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "primary.main",
                fontSize: "1rem",
              }}
            >
              {formatPrice(payableAmount)} تومان
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              component={Link}
              href={order.code != null ? `/order/${order.code}` : "#"}
              variant="outlined"
              size="small"
              startIcon={<ChevronLeft size={16} />}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              مشاهده جزئیات
            </Button>
            {canCancel && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={
                  isCancelling ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <XCircle size={16} />
                  )
                }
                disabled={isCancelling}
                onClick={() => order.code != null && onCancel(order.code)}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                {isCancelling ? "در حال لغو..." : "لغو سفارش"}
              </Button>
            )}
          </Stack>
        </Box>
      </Box>
    </Card>
  );
}

export default function OrderListView({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingCode, setCancellingCode] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await orderApi.listOrders();
        if (isMounted) {
          setOrders(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Orders load error:", err);
          setError("خطا در بارگذاری سفارشات. لطفا دوباره تلاش کنید.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleCancel = async (code: number) => {
    if (cancellingCode != null) return;
    setCancellingCode(code);
    try {
      await orderApi.cancelOrder(code);
      setOrders((prev) =>
        prev.map((o) =>
          o.code === code ? { ...o, status: "cancelled" } : o
        )
      );
    } catch (err) {
      console.error("Cancel order error:", err);
      setError("خطا در لغو سفارش. لطفا دوباره تلاش کنید.");
    } finally {
      setCancellingCode(null);
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
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "grey.100",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <Package size={48} className="text-gray-400" />
          </Box>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
            لطفا برای مشاهده سفارشات وارد شوید
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            با ورود به حساب کاربری، لیست سفارشات شما نمایش داده می‌شود
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push(`/login?next=${encodeURIComponent("/orders")}`)}
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

  if (orders.length === 0) {
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <ShoppingBag size={48} className="text-gray-400" />
          </Box>
          <Typography variant="h5" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>
            هنوز سفارشی ثبت نکرده‌اید
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            پس از ثبت سفارش، لیست آن‌ها اینجا نمایش داده می‌شود
          </Typography>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Truck size={20} />}
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

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
      <Box sx={{ mb: { xs: 4, md: 6 } }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: "bold",
            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
          }}
        >
          سفارشات من
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {orders.length} سفارش
        </Typography>
      </Box>

      <Stack spacing={3}>
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onCancel={handleCancel}
            isCancelling={cancellingCode === order.code}
          />
        ))}
      </Stack>
    </Container>
  );
}
