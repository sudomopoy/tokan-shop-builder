"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  IconButton,
  TextField,
  Divider,
  Breadcrumbs,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  Add,
  Remove,
  Delete,
  ShoppingCart,
  NavigateNext,
  Home,
} from "@mui/icons-material";
import type { WidgetConfig } from "@/themes/types";
import { basketApi, type Basket } from "@/lib/api/basketApi";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { formatPrice } from "../../utils/helpers";

export default function BasketWidget({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [basket, setBasket] = useState<Basket | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const b = await basketApi.get();
      setBasket(b);
    } catch (e) {
      console.error(e);
      setError("خطا در بارگذاری سبد خرید");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setBasket(null);
      return;
    }
    load();
  }, [isAuthenticated]);

  const goLogin = () => {
    const current = `${pathname ?? ""}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    router.push(`/login?next=${encodeURIComponent(current)}`);
  };

  const subtotal = useMemo(() => basket?.total_price ?? 0, [basket]);

  const updateQty = async (itemId: string, nextQty: number) => {
    if (!basket) return;
    setBusyItemId(itemId);
    try {
      const updated = await basketApi.updateItem(itemId, nextQty);
      setBasket(updated);
    } catch (e) {
      console.error(e);
      setError("خطا در به‌روزرسانی تعداد");
    } finally {
      setBusyItemId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!basket) return;
    setBusyItemId(itemId);
    try {
      const updated = await basketApi.removeItem(itemId);
      setBasket(updated);
    } catch (e) {
      console.error(e);
      setError("خطا در حذف محصول");
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <>
      <Box sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", py: 2 }}>
        <Container maxWidth="xl">
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}>
              <Home sx={{ mr: 0.5 }} fontSize="small" />
              خانه
            </Link>
            <Typography color="text.primary">سبد خرید</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
          سبد خرید
        </Typography>

        {!isAuthenticated ? (
          <Card>
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <ShoppingCart sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                برای مشاهده سبد خرید خود، لطفاً وارد شوید.
              </Typography>
              <Button variant="contained" size="large" onClick={goLogin}>
                ورود
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card>
            <CardContent sx={{ p: 6, textAlign: "center" }}>
              <CircularProgress />
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                در حال بارگذاری...
              </Typography>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
              <Button variant="contained" onClick={load}>
                تلاش مجدد
              </Button>
            </CardContent>
          </Card>
        ) : !basket || basket.items.length === 0 ? (
          <Card>
            <CardContent sx={{ p: 6, textAlign: "center" }}>
              <ShoppingCart sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                سبد خرید شما خالی است.
              </Typography>
              <Button
                component={Link}
                href="/products/search"
                variant="contained"
                size="large"
              >
                شروع خرید
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 3 }}>
            <Box>
              <Card>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>محصول</TableCell>
                        <TableCell align="center">قیمت واحد</TableCell>
                        <TableCell align="center">تعداد</TableCell>
                        <TableCell align="center">قیمت کل</TableCell>
                        <TableCell align="center">عملیات</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {basket.items.map((item) => {
                        const p = item.product_details;
                        const image =
                          p.main_image?.file ||
                          p.list_images?.[0]?.file ||
                          "https://via.placeholder.com/300x300?text=Product";
                        const busy = busyItemId === item.id;
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Stack direction="row" spacing={2} alignItems="center">
                                <Box
                                  component="img"
                                  src={image}
                                  alt={p.title}
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    objectFit: "cover",
                                    borderRadius: 2,
                                  }}
                                />
                                <Box>
                                  <Typography
                                    component={Link}
                                    href={`/product/${p.id}`}
                                    sx={{
                                      fontWeight: 600,
                                      textDecoration: "none",
                                      color: "text.primary",
                                      "&:hover": { color: "primary.main" },
                                    }}
                                  >
                                    {p.title}
                                  </Typography>
                                  {item.variant_details?.title && (
                                    <Typography variant="body2" color="text.secondary">
                                      {item.variant_details.title}
                                    </Typography>
                                  )}
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              <Typography fontWeight={600}>
                                {formatPrice(parseFloat(p.sell_price))} تومان
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                <IconButton
                                  size="small"
                                  disabled={busy || item.quantity <= 1}
                                  onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                                >
                                  <Remove />
                                </IconButton>
                                <TextField
                                  value={item.quantity}
                                  size="small"
                                  inputProps={{
                                    readOnly: true,
                                    style: { textAlign: "center", width: 40 },
                                  }}
                                />
                                <IconButton
                                  size="small"
                                  disabled={busy}
                                  onClick={() => updateQty(item.id, item.quantity + 1)}
                                >
                                  <Add />
                                </IconButton>
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              <Typography fontWeight={700} color="primary">
                                {formatPrice(item.total_price)} تومان
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                color="error"
                                disabled={busy}
                                onClick={() => removeItem(item.id)}
                                aria-label="حذف"
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>

              <Box sx={{ mt: 3 }}>
                <Button
                  component={Link}
                  href="/products/search"
                  variant="outlined"
                  startIcon={<ShoppingCart />}
                >
                  ادامه خرید
                </Button>
              </Box>
            </Box>

            <Box>
              <Card sx={{ position: "sticky", top: 24 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                    خلاصه سبد خرید
                  </Typography>

                  <Box sx={{ mb: 3, pb: 3, borderBottom: 1, borderColor: "divider" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      کد تخفیف
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        placeholder="کد تخفیف را وارد کنید"
                        fullWidth
                        disabled
                      />
                      <Button variant="contained" disabled>
                        اعمال
                      </Button>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      قابلیت کد تخفیف به زودی فعال می‌شود
                    </Typography>
                  </Box>

                  <Stack spacing={2} sx={{ mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">جمع کل</Typography>
                      <Typography fontWeight={600}>{formatPrice(subtotal)} تومان</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">هزینه ارسال</Typography>
                      <Typography fontWeight={600}>محاسبه در مرحله بعد</Typography>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={700}>
                      مبلغ قابل پرداخت
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="primary">
                      {formatPrice(subtotal)} تومان
                    </Typography>
                  </Stack>

                  <Button
                    component={Link}
                    href="/checkout"
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    ادامه و تسویه حساب
                  </Button>

                  <Button
                    component={Link}
                    href="/"
                    variant="text"
                    fullWidth
                  >
                    بازگشت به فروشگاه
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}
      </Container>
    </>
  );
}
