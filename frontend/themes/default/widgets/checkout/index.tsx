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
  Divider,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  ShoppingBag,
  ArrowRight,
  MapPin,
  Truck,
  Plus,
  ChevronUp,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { basketApi, type Basket, type BasketItem } from "@/lib/api/basketApi";
import { orderApi, type ShippingMethod } from "@/lib/api/orderApi";
import { paymentApi, type PaymentGateway } from "@/lib/api/paymentApi";
import { addressApi, type Address } from "@/lib/api/addressApi";
import { metaApi, type Province, type City } from "@/lib/api/metaApi";
import type { WidgetConfig } from "@/themes/types";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fa-IR").format(price);
};

const ensureNumber = (v: unknown): number => {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
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

export default function CheckoutWidget({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [basket, setBasket] = useState<Basket | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipient_fullname: "",
    phone_number: "",
    address_line1: "",
    postcode: "",
    province: "",
    city: "",
  });
  const [addingAddress, setAddingAddress] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState<{ code: number } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [basketData, addressesData, methodsData, gatewaysData, provincesData] =
          await Promise.all([
            basketApi.get(),
            addressApi.list(),
            orderApi.listShippingMethods(true),
            paymentApi.listGateways(),
            metaApi.listProvinces(),
          ]);

        setBasket(basketData ?? null);
        setAddresses(addressesData);
        setShippingMethods(methodsData);
        setPaymentGateways(gatewaysData);
        setProvinces(provincesData);

        if (addressesData.length > 0 && !selectedAddressId) {
          const defaultAddr = addressesData.find((a) => a.frequently_used) ?? addressesData[0];
          setSelectedAddressId(defaultAddr.id);
        }
        if (methodsData.length > 0 && !selectedShippingId) {
          setSelectedShippingId(methodsData[0].id);
        }
        if (gatewaysData.length > 0 && !selectedGatewayId) {
          setSelectedGatewayId(gatewaysData[0].id);
        }
      } catch (err) {
        console.error("Checkout load error:", err);
        setError(tFrontendAuto("fe.0223865b884e"));
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
    metaApi.listCities(newAddress.province).then(setCities);
  }, [newAddress.province]);

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, px: 2 }}>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            لطفا برای ادامه وارد شوید
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push(`/login?next=/checkout`)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            ورود به حساب کاربری
          </Button>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", minHeight: 400, alignItems: "center" }}>
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

  if (orderSuccess) {
    return (
      <Container maxWidth="md" sx={{ py: 8, px: 2 }}>
        <Card variant="outlined" sx={{ borderRadius: 3, p: 4 }}>
          <Box sx={{ textAlign: "center" }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "success.light",
                color: "success.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
                fontSize: "2rem",
              }}
            >
              ✓
            </Box>
            <Typography variant="h5" fontWeight="bold" color="success.main" gutterBottom>
              سفارش با موفقیت ثبت شد
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              شماره سفارش شما: <strong>{orderSuccess.code}</strong>
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              <Button
                variant="contained"
                component={Link}
                href="/"
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                بازگشت به فروشگاه
              </Button>
            </Stack>
          </Box>
        </Card>
      </Container>
    );
  }

  if (!basket || basket.items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, px: 2 }}>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <ShoppingBag size={64} className="text-gray-300" style={{ marginBottom: 16 }} />
          <Typography variant="h5" fontWeight="bold" color="text.secondary" gutterBottom>
            سبد خرید شما خالی است
          </Typography>
          <Button
            variant="outlined"
            component={Link}
            href="/basket"
            startIcon={<ArrowRight />}
            sx={{ mt: 2, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            مشاهده سبد خرید
          </Button>
        </Box>
      </Container>
    );
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.recipient_fullname || !newAddress.phone_number || !newAddress.address_line1 || !newAddress.province || !newAddress.city) {
      setError(tFrontendAuto("fe.45f671375270"));
      return;
    }
    setAddingAddress(true);
    setError(null);
    try {
      const created = await addressApi.create({
        recipient_fullname: newAddress.recipient_fullname,
        phone_number: newAddress.phone_number,
        address_line1: newAddress.address_line1,
        postcode: newAddress.postcode || undefined,
        province: newAddress.province,
        city: newAddress.city,
      });
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
      setNewAddress({ recipient_fullname: "", phone_number: "", address_line1: "", postcode: "", province: "", city: "" });
      setShowAddAddress(false);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "خطا در افزودن آدرس.";
      setError(msg || "خطا در افزودن آدرس.");
    } finally {
      setAddingAddress(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedAddressId || !selectedShippingId) {
      setError(tFrontendAuto("fe.383fe87b996f"));
      return;
    }
    if (!selectedGatewayId) {
      setError(tFrontendAuto("fe.cc595c628d02"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const items = basket!.items.map((item: BasketItem) => ({
        product_id: item.product,
        variant_id: item.variant || null,
        quantity: item.quantity,
      }));

      const order = await orderApi.createPreOrder({
        items,
        shipping_method: selectedShippingId,
        delivery_address: selectedAddressId,
      });

      const { payment_link } = await orderApi.initOrderPayment(order.id, selectedGatewayId);
      if (payment_link) {
        window.location.href = payment_link;
      } else {
        setError(tFrontendAuto("fe.2279a5dbe19e"));
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; detail?: string } } };
      const msg =
        axiosErr?.response?.data?.error ??
        axiosErr?.response?.data?.detail ??
        "خطا در ثبت سفارش. لطفا دوباره تلاش کنید.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPrice = ensureNumber(basket.total_price);
  const selectedShipping = shippingMethods.find((m) => m.id === selectedShippingId);
  const shippingCost = selectedShipping ? ensureNumber(selectedShipping.base_shipping_price) : 0;
  const payableAmount = totalPrice + shippingCost;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
      <Typography
        variant="h4"
        component="h1"
        fontWeight="bold"
        sx={{ mb: 4, fontSize: { xs: "1.5rem", md: "2rem" } }}
      >
        تسویه حساب
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems="stretch">
        {/* Left: Address & Shipping */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <MapPin size={22} />
                <Typography variant="h6" fontWeight="bold">
                  آدرس تحویل
                </Typography>
              </Box>
              {addresses.length > 0 ? (
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={selectedAddressId ?? ""}
                    onChange={(_, v) => setSelectedAddressId(v)}
                  >
                    {addresses.map((addr) => (
                      <FormControlLabel
                        key={addr.id}
                        value={addr.id}
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography fontWeight={600}>{addr.recipient_fullname}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {addr.address_line1} • {addr.phone_number}
                            </Typography>
                          </Box>
                        }
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  آدرسی ثبت نشده است.
                </Typography>
              )}
              <Collapse in={showAddAddress}>
                <Box
                  component="form"
                  onSubmit={handleAddAddress}
                  sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <TextField
                    label={tFrontendAuto("fe.ac1ff094272f")}
                    value={newAddress.recipient_fullname}
                    onChange={(e) => setNewAddress((a) => ({ ...a, recipient_fullname: e.target.value }))}
                    required
                    fullWidth
                  />
                  <TextField
                    label={tFrontendAuto("fe.7b7e803a0df9")}
                    value={newAddress.phone_number}
                    onChange={(e) => setNewAddress((a) => ({ ...a, phone_number: e.target.value }))}
                    required
                    fullWidth
                  />
                  <TextField
                    label={tFrontendAuto("fe.889f46873df4")}
                    value={newAddress.address_line1}
                    onChange={(e) => setNewAddress((a) => ({ ...a, address_line1: e.target.value }))}
                    required
                    fullWidth
                    multiline
                    rows={2}
                  />
                  <TextField
                    label={tFrontendAuto("fe.de246976c5ed")}
                    value={newAddress.postcode}
                    onChange={(e) => setNewAddress((a) => ({ ...a, postcode: e.target.value }))}
                    fullWidth
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      select
                      label={tFrontendAuto("fe.f1402dc45f3f")}
                      value={newAddress.province}
                      onChange={(e) => setNewAddress((a) => ({ ...a, province: e.target.value, city: "" }))}
                      required
                      fullWidth
                      SelectProps={{ native: true }}
                    >
                      <option value="">{tFrontendAuto("fe.1afe110b90bd")}</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label={tFrontendAuto("fe.9ddae2219b7e")}
                      value={newAddress.city}
                      onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}
                      required
                      fullWidth
                      disabled={!newAddress.province}
                      SelectProps={{ native: true }}
                    >
                      <option value="">{tFrontendAuto("fe.05a28b35a9a1")}</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </TextField>
                  </Stack>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={addingAddress}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                  >
                    {addingAddress ? <CircularProgress size={24} /> : "ثبت آدرس"}
                  </Button>
                </Box>
              </Collapse>
              <Button
                startIcon={showAddAddress ? <ChevronUp size={18} /> : <Plus size={18} />}
                onClick={() => setShowAddAddress(!showAddAddress)}
                sx={{ mt: 1, textTransform: "none" }}
              >
                {showAddAddress ? "بستن" : "افزودن آدرس جدید"}
              </Button>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Truck size={22} />
                <Typography variant="h6" fontWeight="bold">
                  روش ارسال
                </Typography>
              </Box>
              {shippingMethods.length > 0 ? (
                <RadioGroup
                  value={selectedShippingId ?? ""}
                  onChange={(_, v) => setSelectedShippingId(v)}
                >
                  {shippingMethods.map((method) => (
                    <FormControlLabel
                      key={method.id}
                      value={method.id}
                      control={<Radio />}
                      label={
                        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                          <Typography>{method.name}</Typography>
                          <Typography fontWeight={600} color="primary.main">
                            {formatPrice(ensureNumber(method.base_shipping_price))} تومان
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 1 }}
                    />
                  ))}
                </RadioGroup>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  روش ارسالی تعریف نشده است.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <CreditCard size={22} />
                <Typography variant="h6" fontWeight="bold">
                  درگاه پرداخت
                </Typography>
              </Box>
              {paymentGateways.length > 0 ? (
                <RadioGroup
                  value={selectedGatewayId ?? ""}
                  onChange={(_, v) => setSelectedGatewayId(v)}
                >
                  {paymentGateways.map((gw) => (
                    <FormControlLabel
                      key={gw.id}
                      value={gw.id}
                      control={<Radio />}
                      label={<Typography>{gw.title}</Typography>}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </RadioGroup>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  درگاه پرداختی تعریف نشده است. در تنظیمات فروشگاه درگاه اضافه کنید.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Right: Order Summary */}
        <Box sx={{ width: { xs: "100%", md: 400 }, flexShrink: 0 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, position: { md: "sticky" }, top: { md: 100 } }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                خلاصه سفارش
              </Typography>

              <Stack spacing={1} sx={{ mb: 2, maxHeight: 200, overflowY: "auto" }}>
                {basket.items.map((item) => {
                  const product = item.product_details;
                  const variant = item.variant_details;
                  const imageUrl =
                    variant?.main_image?.file ||
                    product.main_image?.file ||
                    product.list_images?.[0]?.file;
                  const variantLabel = variant
                    ? formatVariantAttributes((variant as { attribute_values?: unknown[] })?.attribute_values ?? [])
                    : "";
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                        py: 1,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={imageUrl || "https://via.placeholder.com/60"}
                        alt={product.title}
                        sx={{ width: 56, height: 56, borderRadius: 1, objectFit: "cover" }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {product.title}
                        </Typography>
                        {variantLabel && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {variantLabel}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          {item.quantity} × {formatPrice(ensureNumber(item.unit_price))} تومان
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {formatPrice(ensureNumber(item.total_price))}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>

              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography color="text.secondary">{tFrontendAuto("fe.1ea35e715a0b")}</Typography>
                <Typography>{formatPrice(totalPrice)} تومان</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography color="text.secondary">{tFrontendAuto("fe.c580b95eac6e")}</Typography>
                <Typography>{formatPrice(shippingCost)} تومان</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography fontWeight="bold">{tFrontendAuto("fe.2e6cbd8c252b")}</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {formatPrice(payableAmount)} تومان
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={submitting || !selectedAddressId || !selectedShippingId || !selectedGatewayId || paymentGateways.length === 0}
                onClick={handleSubmitOrder}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.5,
                }}
              >
                {submitting ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    در حال انتقال به درگاه پرداخت...
                  </>
                ) : (
                  "ثبت سفارش و پرداخت"
                )}
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Container>
  );
}
