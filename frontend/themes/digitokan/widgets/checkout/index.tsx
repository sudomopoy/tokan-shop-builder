"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Breadcrumbs,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Home, NavigateNext } from "@mui/icons-material";
import type { WidgetConfig } from "@/themes/types";
import { basketApi, type Basket } from "@/lib/api/basketApi";
import { orderApi, type ShippingMethod } from "@/lib/api/orderApi";
import { paymentApi, type PaymentGateway } from "@/lib/api/paymentApi";
import { addressApi, type Address } from "@/lib/api/addressApi";
import { metaApi, type Province, type City } from "@/lib/api/metaApi";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { formatPrice } from "../../utils/helpers";

const ensureNumber = (v: unknown): number =>
  typeof v === "string" ? parseFloat(v) || 0 : typeof v === "number" ? v : 0;

export default function CheckoutWidget({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [basket, setBasket] = useState<Basket | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedShippingId, setSelectedShippingId] = useState<string>("");
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>("");

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipient_fullname: "",
    phone_number: "",
    province: "",
    city: "",
    address_line1: "",
    postcode: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const basketPromise = basketApi.get();
        const gatewayPromise = paymentApi.listGateways();
        const [b, g] = await Promise.all([basketPromise, gatewayPromise]);
        setBasket(b ?? null);
        setGateways(g);
        if (g.length && !selectedGatewayId) setSelectedGatewayId(g[0]!.id);
        const allDig =
          b?.items.every((i) => i.product_details?.product_type === "digital") ?? false;
        if (!allDig) {
          const [a, s, p] = await Promise.all([
            addressApi.list(),
            orderApi.listShippingMethods(true),
            metaApi.listProvinces(),
          ]);
          setAddresses(a);
          setShippingMethods(s);
          setProvinces(p);
          if (a.length === 0) setShowAddAddress(true);
          else if (!selectedAddressId)
            setSelectedAddressId(a.find((x) => x.frequently_used)?.id ?? a[0]!.id);
          if (s.length && !selectedShippingId) setSelectedShippingId(s[0]!.id);
        }
      } catch (e) {
        console.error(e);
        setError("خطا در بارگذاری اطلاعات");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!newAddress.province) {
      setCities([]);
      return;
    }
    metaApi.listCities(newAddress.province).then(setCities).catch(() => setCities([]));
  }, [newAddress.province]);

  const total = useMemo(() => ensureNumber(basket?.total_price ?? 0), [basket]);
  const allDigital = useMemo(
    () => basket?.items.every((i) => i.product_details?.product_type === "digital") ?? false,
    [basket]
  );
  const selectedShipping = useMemo(
    () => shippingMethods.find((m) => m.id === selectedShippingId),
    [shippingMethods, selectedShippingId]
  );
  const shippingCost = useMemo(
    () =>
      allDigital
        ? 0
        : selectedShipping
          ? ensureNumber(selectedShipping.base_shipping_price)
          : 0,
    [allDigital, selectedShipping]
  );
  const payableAmount = total + shippingCost;

  const submitOrder = async () => {
    setError(null);
    if (!basket || basket.items.length === 0) {
      setError("سبد خرید خالی است");
      return;
    }
    if (!allDigital) {
      if (!selectedAddressId) {
        setError("لطفاً آدرس تحویل را انتخاب کنید");
        return;
      }
      if (!selectedShippingId) {
        setError("لطفاً روش ارسال را انتخاب کنید");
        return;
      }
    }
    if (!selectedGatewayId) {
      setError("لطفاً روش پرداخت را انتخاب کنید");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: Parameters<typeof orderApi.createPreOrder>[0] = {
        items: basket.items.map((i) => ({
          product_id: i.product,
          variant_id: i.variant,
          quantity: i.quantity,
        })),
      };
      if (!allDigital) {
        payload.shipping_method = selectedShippingId;
        payload.delivery_address = selectedAddressId;
      }
      const order = await orderApi.createPreOrder(payload);
      const init = await orderApi.initOrderPayment(order.id, selectedGatewayId);
      window.location.href = init.payment_link;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      const msg = err?.response?.data?.error;
      setError(msg || "ثبت سفارش ناموفق بود. لطفاً دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  const addAddress = async () => {
    if (
      !newAddress.recipient_fullname ||
      !newAddress.phone_number ||
      !newAddress.province ||
      !newAddress.city ||
      !newAddress.address_line1
    ) {
      setError("لطفاً تمام فیلدهای الزامی را پر کنید");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await addressApi.create({
        recipient_fullname: newAddress.recipient_fullname,
        phone_number: newAddress.phone_number,
        province: newAddress.province,
        city: newAddress.city,
        address_line1: newAddress.address_line1,
        postcode: newAddress.postcode || undefined,
      });
      const next = [created, ...addresses];
      setAddresses(next);
      setSelectedAddressId(created.id);
      setShowAddAddress(false);
      setNewAddress({
        recipient_fullname: "",
        phone_number: "",
        province: "",
        city: "",
        address_line1: "",
        postcode: "",
      });
    } catch (e) {
      console.error(e);
      setError("خطا در افزودن آدرس");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Card>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
              برای ادامه خرید وارد شوید
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push(`/login?next=/checkout`)}
            >
              ورود به حساب کاربری
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Card>
          <CardContent sx={{ p: 6, textAlign: "center" }}>
            <CircularProgress />
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              در حال بارگذاری...
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!basket || basket.items.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Card>
          <CardContent sx={{ p: 6, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              سبد خرید شما خالی است.
            </Typography>
            <Button component={Link} href="/basket" variant="contained">
              مشاهده سبد خرید
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const steps = allDigital
    ? ["بررسی سبد", "پرداخت"]
    : ["بررسی سبد", "آدرس و ارسال", "پرداخت"];

  return (
    <>
      <Box sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", py: 2 }}>
        <Container maxWidth="xl">
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Link
              href="/"
              style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}
            >
              <Home sx={{ mr: 0.5 }} fontSize="small" />
              خانه
            </Link>
            <Link href="/basket" style={{ textDecoration: "none", color: "inherit" }}>
              سبد خرید
            </Link>
            <Typography color="text.primary">تسویه حساب</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stepper activeStep={1} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 3 }}>
          <Stack spacing={3}>
            {!allDigital && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={700}>
                      آدرس تحویل
                    </Typography>
                    <Button size="small" onClick={() => setShowAddAddress((v) => !v)}>
                      {showAddAddress ? "بستن" : "افزودن آدرس"}
                    </Button>
                  </Stack>

                  {addresses.length > 0 && (
                    <RadioGroup value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
                      <Stack spacing={2}>
                        {addresses.map((a) => (
                          <Card key={a.id} variant="outlined">
                            <CardContent>
                              <FormControlLabel
                                value={a.id}
                                control={<Radio />}
                                label={
                                  <Box>
                                    <Typography fontWeight={600}>{a.recipient_fullname}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {a.address_line1}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {a.phone_number}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </RadioGroup>
                  )}

                  {showAddAddress && (
                    <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: "divider" }}>
                      <Stack spacing={2}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                          <TextField
                            label="نام و نام خانوادگی"
                            fullWidth
                            value={newAddress.recipient_fullname}
                            onChange={(e) =>
                              setNewAddress((s) => ({ ...s, recipient_fullname: e.target.value }))
                            }
                          />
                          <TextField
                            label="شماره تماس"
                            fullWidth
                            value={newAddress.phone_number}
                            onChange={(e) =>
                              setNewAddress((s) => ({ ...s, phone_number: e.target.value }))
                            }
                          />
                        </Stack>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                          <FormControl fullWidth>
                            <InputLabel>استان</InputLabel>
                            <Select
                              value={newAddress.province}
                              label="استان"
                              onChange={(e) =>
                                setNewAddress((s) => ({ ...s, province: e.target.value, city: "" }))
                              }
                            >
                              {provinces.map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                  {p.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl fullWidth disabled={!newAddress.province}>
                            <InputLabel>شهر</InputLabel>
                            <Select
                              value={newAddress.city}
                              label="شهر"
                              onChange={(e) => setNewAddress((s) => ({ ...s, city: e.target.value }))}
                            >
                              {cities.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                  {c.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>
                        <TextField
                          label="آدرس کامل"
                          fullWidth
                          multiline
                          rows={3}
                          value={newAddress.address_line1}
                          onChange={(e) =>
                            setNewAddress((s) => ({ ...s, address_line1: e.target.value }))
                          }
                        />
                        <TextField
                          label="کد پستی"
                          fullWidth
                          value={newAddress.postcode}
                          onChange={(e) => setNewAddress((s) => ({ ...s, postcode: e.target.value }))}
                        />
                        <Button variant="contained" onClick={addAddress} disabled={submitting}>
                          ذخیره آدرس
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {!allDigital && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                    روش ارسال
                  </Typography>
                  <RadioGroup value={selectedShippingId} onChange={(e) => setSelectedShippingId(e.target.value)}>
                    <Stack spacing={2}>
                      {shippingMethods.map((m) => (
                        <Card key={m.id} variant="outlined">
                          <CardContent>
                            <FormControlLabel
                              value={m.id}
                              control={<Radio />}
                              label={
                                <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
                                  <Box>
                                    <Typography fontWeight={600}>{m.name}</Typography>
                                    {m.description && (
                                      <Typography variant="body2" color="text.secondary">
                                        {m.description}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Typography fontWeight={700} color="primary">
                                    {ensureNumber(m.base_shipping_price) === 0
                                      ? "رایگان"
                                      : `${formatPrice(ensureNumber(m.base_shipping_price))} تومان`}
                                  </Typography>
                                </Stack>
                              }
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  روش پرداخت
                </Typography>
                <RadioGroup value={selectedGatewayId} onChange={(e) => setSelectedGatewayId(e.target.value)}>
                  <Stack spacing={2}>
                    {gateways.map((g) => (
                      <Card key={g.id} variant="outlined">
                        <CardContent>
                          <FormControlLabel
                            value={g.id}
                            control={<Radio />}
                            label={
                              <Box>
                                <Typography fontWeight={600}>{g.title}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  پرداخت امن آنلاین
                                </Typography>
                              </Box>
                            }
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </RadioGroup>
              </CardContent>
            </Card>
          </Stack>

          <Box>
            <Card sx={{ position: "sticky", top: 24 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  خلاصه سفارش
                </Typography>

                <Stack spacing={2} sx={{ mb: 3 }}>
                  {basket.items.slice(0, 3).map((i) => {
                    const p = i.product_details;
                    const img =
                      p.main_image?.file ||
                      p.list_images?.[0]?.file ||
                      "https://via.placeholder.com/200x200?text=Product";
                    return (
                      <Stack key={i.id} direction="row" spacing={2}>
                        <Box
                          component="img"
                          src={img}
                          alt={p.title}
                          sx={{ width: 60, height: 60, objectFit: "cover", borderRadius: 1 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {p.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            تعداد: {i.quantity}
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="primary">
                            {formatPrice(i.total_price)} تومان
                          </Typography>
                        </Box>
                      </Stack>
                    );
                  })}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">جمع کل</Typography>
                    <Typography fontWeight={600}>{formatPrice(total)} تومان</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">هزینه ارسال</Typography>
                    <Typography fontWeight={600}>
                      {shippingCost === 0 ? "رایگان" : `${formatPrice(shippingCost)} تومان`}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    مبلغ قابل پرداخت
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    {formatPrice(payableAmount)} تومان
                  </Typography>
                </Stack>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={submitting}
                  onClick={submitOrder}
                  sx={{ mb: 2 }}
                >
                  {submitting ? "در حال ثبت..." : "ثبت و پرداخت سفارش"}
                </Button>

                <Button component={Link} href="/basket" variant="text" fullWidth>
                  بازگشت به سبد خرید
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </>
  );
}
