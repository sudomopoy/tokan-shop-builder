"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WidgetConfig } from "@/themes/types";
import { basketApi, type Basket } from "@/lib/api/basketApi";
import { orderApi, type ShippingMethod } from "@/lib/api/orderApi";
import { paymentApi, type PaymentGateway } from "@/lib/api/paymentApi";
import { addressApi, type Address } from "@/lib/api/addressApi";
import { metaApi, type Province, type City } from "@/lib/api/metaApi";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";

const formatPrice = (price: number): string => new Intl.NumberFormat("fa-IR").format(price);
const ensureNumber = (v: unknown): number => (typeof v === "string" ? parseFloat(v) || 0 : typeof v === "number" ? v : 0);

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
          (b?.items.every((i) => i.product_details?.product_type === "digital") ?? false);
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
        setError("خطا در بارگذاری اطلاعات.");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    () =>
      basket?.items.every(
        (i) => i.product_details?.product_type === "digital"
      ) ?? false,
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

  const [customInputs, setCustomInputs] = useState<Record<string, Record<string, string>>>({});

  const submitOrder = async () => {
    setError(null);
    if (!basket || basket.items.length === 0) {
      setError("سبد خرید شما خالی است.");
      return;
    }
    if (!allDigital) {
      if (!selectedAddressId) {
        setError("لطفاً آدرس تحویل را انتخاب یا ثبت کنید.");
        setShowAddAddress(true);
        return;
      }
      if (!selectedShippingId) {
        setError("لطفاً روش ارسال را انتخاب کنید.");
        return;
      }
    }
    if (!selectedGatewayId) {
      setError("لطفاً روش پرداخت را انتخاب کنید.");
      return;
    }
    if (allDigital) {
      for (const item of basket.items) {
        const defs = item.product_details?.custom_input_definitions ?? [];
        const values = customInputs[item.id] ?? {};
        for (const d of defs) {
          if (d.required && !(values[d.key] ?? "").trim()) {
            setError(`لطفاً "${d.label}" را برای ${item.product_details?.title} وارد کنید.`);
            return;
          }
        }
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: Parameters<typeof orderApi.createPreOrder>[0] = {
        items: basket.items.map((i) => ({
          product_id: i.product,
          variant_id: i.variant,
          quantity: i.quantity,
          custom_input_values: allDigital ? (customInputs[i.id] ?? {}) : undefined,
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
    if (!newAddress.recipient_fullname || !newAddress.phone_number || !newAddress.province || !newAddress.city || !newAddress.address_line1) {
      setError("لطفاً تمام فیلدهای ضروری آدرس را وارد کنید.");
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
      setNewAddress({ recipient_fullname: "", phone_number: "", province: "", city: "", address_line1: "", postcode: "" });
    } catch (e) {
      console.error(e);
      setError("ثبت آدرس ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="container py-12">
        <div className="bg-white rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-dark mb-4">لطفا برای ادامه وارد شوید</h2>
          <button onClick={() => router.push(`/login?next=/checkout`)} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            ورود به حساب کاربری
          </button>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="container py-12">
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">در حال بارگذاری...</div>
      </section>
    );
  }

  if (error && !basket) {
    return (
      <section className="container py-12">
        <div className="bg-white rounded-xl p-6">
          <div className="bg-red-50 text-red-700 rounded-lg p-4">{error}</div>
        </div>
      </section>
    );
  }

  if (!basket || basket.items.length === 0) {
    return (
      <section className="container py-12">
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">
          سبد خرید شما خالی است.
          <div className="mt-6">
            <Link href="/basket" className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
              مشاهده سبد خرید
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {error && (
        <section className="container pt-6">
          <div className="bg-red-50 text-red-700 rounded-xl p-4 border border-red-200">{error}</div>
        </section>
      )}
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary transition">
              خانه
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <Link href="/basket" className="hover:text-primary transition">
              سبد خرید
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <span className="text-dark">تسویه حساب</span>
          </nav>
        </div>
      </div>

      <section className="container py-6">
        {/* Checkout Steps (static visual) - simplified for digital-only */}
        <div className="bg-white rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {allDigital ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full step-completed flex items-center justify-center">✓</div>
                  <span className="hidden md:block text-sm font-medium">اطلاعات خرید</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 mx-4">
                  <div className="h-full bg-primary" style={{ width: "70%" }} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full step-active flex items-center justify-center">۲</div>
                  <span className="hidden md:block text-sm font-medium">پرداخت</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full step-completed flex items-center justify-center">✓</div>
                  <span className="hidden md:block text-sm font-medium">اطلاعات ارسال</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 mx-4">
                  <div className="h-full bg-primary" style={{ width: "70%" }} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full step-active flex items-center justify-center">۲</div>
                  <span className="hidden md:block text-sm font-medium">روش ارسال</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 mx-4" />
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">۳</div>
                  <span className="hidden md:block text-sm font-medium">پرداخت</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Custom inputs for digital products */}
            {allDigital &&
              basket.items.some((i) => (i.product_details?.custom_input_definitions?.length ?? 0) > 0) && (
              <div className="bg-white rounded-xl p-6">
                <h2 className="text-xl font-bold text-dark mb-6">اطلاعات مورد نیاز برای هر محصول</h2>
                <div className="space-y-6">
                  {basket.items.map((item) => {
                    const defs = item.product_details?.custom_input_definitions ?? [];
                    if (defs.length === 0) return null;
                    return (
                      <div key={item.id} className="border rounded-lg p-4">
                        <h3 className="font-medium text-dark mb-4">{item.product_details?.title}</h3>
                        <div className="space-y-4">
                          {defs.map((d) => (
                            <div key={d.key}>
                              <label className="block text-sm font-medium text-dark mb-2">
                                {d.label}
                                {d.required ? " *" : ""}
                              </label>
                              {d.type === "textarea" ? (
                                <textarea
                                  value={customInputs[item.id]?.[d.key] ?? ""}
                                  onChange={(e) =>
                                    setCustomInputs((s) => ({
                                      ...s,
                                      [item.id]: {
                                        ...(s[item.id] ?? {}),
                                        [d.key]: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none"
                                  rows={3}
                                />
                              ) : (
                                <input
                                  type={d.type === "password" ? "password" : d.type === "email" ? "email" : "text"}
                                  value={customInputs[item.id]?.[d.key] ?? ""}
                                  onChange={(e) =>
                                    setCustomInputs((s) => ({
                                      ...s,
                                      [item.id]: {
                                        ...(s[item.id] ?? {}),
                                        [d.key]: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shipping Information - only for physical */}
            {!allDigital && (
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between gap-3 mb-6">
                <h2 className="text-xl font-bold text-dark">اطلاعات ارسال</h2>
                <button
                  type="button"
                  onClick={() => setShowAddAddress((v) => !v)}
                  className="text-primary font-bold text-sm hover:underline"
                >
                  {showAddAddress ? "بستن" : "افزودن آدرس"}
                </button>
              </div>

              {addresses.length ? (
                <div className="space-y-3">
                  {addresses.map((a) => (
                    <label key={a.id} className="flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition" style={{ borderColor: selectedAddressId === a.id ? "var(--primary-color)" : "rgb(229 231 235)" }}>
                      <input type="radio" name="address" className="mt-1" checked={selectedAddressId === a.id} onChange={() => setSelectedAddressId(a.id)} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-dark">{a.recipient_fullname}</span>
                          {a.frequently_used ? <span className="text-xs text-primary font-bold">پیش‌فرض</span> : null}
                        </div>
                        <p className="text-sm text-gray-600">{a.address_line1}</p>
                        <p className="text-xs text-gray-500 mt-1" dir="ltr">
                          {a.phone_number}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">آدرسی ثبت نشده است.</p>
              )}

              {showAddAddress ? (
                <div className="mt-6 border-t pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">نام و نام خانوادگی *</label>
                      <input
                        value={newAddress.recipient_fullname}
                        onChange={(e) => setNewAddress((s) => ({ ...s, recipient_fullname: e.target.value }))}
                        className="w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">شماره تماس *</label>
                      <input
                        value={newAddress.phone_number}
                        onChange={(e) => setNewAddress((s) => ({ ...s, phone_number: e.target.value }))}
                        className="w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">استان *</label>
                      <select
                        value={newAddress.province}
                        onChange={(e) => setNewAddress((s) => ({ ...s, province: e.target.value, city: "" }))}
                        className="w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none"
                      >
                        <option value="">انتخاب کنید</option>
                        {provinces.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">شهر *</label>
                      <select
                        value={newAddress.city}
                        onChange={(e) => setNewAddress((s) => ({ ...s, city: e.target.value }))}
                        className="w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none"
                        disabled={!newAddress.province}
                      >
                        <option value="">انتخاب کنید</option>
                        {cities.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">آدرس کامل *</label>
                    <textarea
                      rows={3}
                      value={newAddress.address_line1}
                      onChange={(e) => setNewAddress((s) => ({ ...s, address_line1: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">کد پستی</label>
                    <input
                      value={newAddress.postcode}
                      onChange={(e) => setNewAddress((s) => ({ ...s, postcode: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addAddress}
                    disabled={submitting}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-60"
                  >
                    ذخیره آدرس
                  </button>
                </div>
              ) : null}
            </div>
            )}

            {/* Shipping Method - only for physical */}
            {!allDigital && (
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-xl font-bold text-dark mb-6">روش ارسال</h2>
              <div className="space-y-4">
                {shippingMethods.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition ${
                      selectedShippingId === m.id ? "border-primary" : "border-gray-200"
                    }`}
                  >
                    <input type="radio" name="shipping" className="mt-1" checked={selectedShippingId === m.id} onChange={() => setSelectedShippingId(m.id)} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-dark">{m.name}</span>
                        <span className="text-primary font-bold">
                          {ensureNumber(m.base_shipping_price) === 0 ? "رایگان" : `${formatPrice(ensureNumber(m.base_shipping_price))} تومان`}
                        </span>
                      </div>
                      {m.description ? <p className="text-sm text-gray-600">{m.description}</p> : null}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            )}

            {/* Payment Method */}
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-xl font-bold text-dark mb-6">روش پرداخت</h2>
              <div className="space-y-4">
                {gateways.map((g) => (
                  <label
                    key={g.id}
                    className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition ${
                      selectedGatewayId === g.id ? "border-primary" : "border-gray-200"
                    }`}
                  >
                    <input type="radio" name="payment" className="mt-1" checked={selectedGatewayId === g.id} onChange={() => setSelectedGatewayId(g.id)} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-dark">{g.title}</span>
                        <span className="text-sm text-gray-500">{g.gateway_type?.title ?? ""}</span>
                      </div>
                      <p className="text-sm text-gray-600">پرداخت از طریق درگاه</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 sticky top-24">
              <h2 className="font-bold text-lg text-dark mb-6">خلاصه سفارش</h2>

              <div className="space-y-3 mb-6 pb-6 border-b">
                {basket.items.slice(0, 3).map((i) => {
                  const p = i.product_details;
                  const img =
                    p.main_image?.file || p.list_images?.[0]?.file || "https://via.placeholder.com/200x200?text=Product";
                  return (
                    <div key={i.id} className="flex gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={p.title} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-dark mb-1 line-clamp-1">{p.title}</h4>
                        <p className="text-xs text-gray-600">تعداد: {i.quantity}</p>
                        <p className="text-sm font-bold text-primary mt-1">{formatPrice(i.total_price)} تومان</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">جمع کل کالاها:</span>
                  <span className="font-medium">{formatPrice(total)} تومان</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">هزینه ارسال:</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? "رایگان" : `${formatPrice(shippingCost)} تومان`}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">مبلغ قابل پرداخت:</span>
                  <span className="font-bold text-2xl text-primary">{formatPrice(payableAmount)} تومان</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 text-red-700 rounded-lg p-4 border border-red-200 text-sm" role="alert">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={submitOrder}
                className="block w-full bg-primary text-white text-center py-4 rounded-lg font-bold hover:bg-primary/90 transition mb-4 disabled:opacity-60"
              >
                {submitting ? "در حال ثبت..." : "ثبت و پرداخت سفارش"}
              </button>

              <Link href="/basket" className="block w-full text-center py-3 text-gray-600 hover:text-primary transition">
                بازگشت به سبد خرید
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
