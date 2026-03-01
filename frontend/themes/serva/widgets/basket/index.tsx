"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { WidgetConfig } from "@/themes/types";
import { basketApi, type Basket } from "@/lib/api/basketApi";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const formatPrice = (price: number): string => new Intl.NumberFormat("fa-IR").format(price);

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
      setError(tFrontendAuto("fe.e6b682b21dab"));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(tFrontendAuto("fe.22850eb65f0f"));
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
      setError(tFrontendAuto("fe.334063cdb3a6"));
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary transition">
              خانه
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <span className="text-dark">{tFrontendAuto("fe.807f37218e5a")}</span>
          </nav>
        </div>
      </div>

      <section className="container py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-6">{tFrontendAuto("fe.807f37218e5a")}</h1>

        {!isAuthenticated ? (
          <div className="bg-white rounded-xl p-6">
            <p className="text-gray-600 mb-4">{tFrontendAuto("fe.23cc4208b12b")}</p>
            <button onClick={goLogin} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
              ورود
            </button>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-500">{tFrontendAuto("fe.3e07344c65a3")}</div>
        ) : error ? (
          <div className="bg-white rounded-xl p-6">
            <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-4">{error}</div>
            <button onClick={load} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
              تلاش مجدد
            </button>
          </div>
        ) : !basket || basket.items.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-500">
            سبد خرید شما خالی است.
            <div className="mt-6">
              <Link href="/products/search" className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
                شروع خرید
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {basket.items.map((item) => {
                const p = item.product_details;
                const image =
                  p.main_image?.file || p.list_images?.[0]?.file || "https://via.placeholder.com/300x300?text=Product";
                const busy = busyItemId === item.id;
                return (
                  <div key={item.id} className="bg-white rounded-xl p-4 md:p-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image} alt={p.title} className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg" />
                    </div>
                    <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-dark mb-2">
                          <Link href={`/product/${p.id}`} className="hover:text-primary transition">
                            {p.title}
                          </Link>
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          {item.variant_details?.title ? <span>{item.variant_details.title}</span> : null}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-primary font-bold">
                            {formatPrice(item.total_price)} تومان
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            disabled={busy || item.quantity <= 1}
                            className="px-3 py-2 hover:bg-gray-100 transition disabled:opacity-50"
                            onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            readOnly
                            value={item.quantity}
                            className="w-12 text-center border-0 focus:ring-0"
                          />
                          <button
                            type="button"
                            disabled={busy}
                            className="px-3 py-2 hover:bg-gray-100 transition disabled:opacity-50"
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={busy}
                          className="text-red-500 hover:text-red-600 transition p-2 disabled:opacity-50"
                          onClick={() => removeItem(item.id)}
                          aria-label="remove"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="bg-white rounded-xl p-4">
                <Link href="/products/search" className="text-primary hover:text-primary/80 transition inline-flex items-center gap-2">
                  <span aria-hidden>→</span> ادامه خرید
                </Link>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 sticky top-24">
                <h2 className="font-bold text-lg text-dark mb-6">{tFrontendAuto("fe.aa69600564cc")}</h2>

                <div className="mb-6 pb-6 border-b">
                  <label className="block text-sm font-medium text-dark mb-2">{tFrontendAuto("fe.4a93ff0edf3d")}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={tFrontendAuto("fe.3193d9be5cd4")}
                      className="flex-1 px-4 py-2 border rounded-lg text-sm focus:border-primary focus:outline-none"
                      disabled
                    />
                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm opacity-60 cursor-not-allowed">
                      اعمال
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{tFrontendAuto("fe.a547d78cfb52")}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{tFrontendAuto("fe.14d33b52d34c")}</span>
                    <span className="font-medium">{formatPrice(subtotal)} تومان</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{tFrontendAuto("fe.8ad37a1a880f")}</span>
                    <span className="font-medium">{tFrontendAuto("fe.bdfaeeca806f")}</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">{tFrontendAuto("fe.2e8a2c608d45")}</span>
                    <span className="font-bold text-2xl text-primary">{formatPrice(subtotal)} تومان</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full bg-primary text-white text-center py-4 rounded-lg font-bold hover:bg-primary/90 transition mb-4"
                >
                  ادامه و تسویه حساب
                </Link>

                <Link href="/" className="block w-full text-center py-3 text-gray-600 hover:text-primary transition">
                  بازگشت به فروشگاه
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
