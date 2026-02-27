"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { productApi, basketApi, type Product } from "@/lib/api";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import type { WidgetConfig } from "@/themes/types";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fa-IR").format(price);
};

export default function ProductsDetail({ config }: { config?: WidgetConfig }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data, setData } = usePageRuntime();
  const pathParams = config?.widgetConfig?.pathParams as Record<string, string | number> | undefined;
  const idFromConfig = (pathParams?.id ?? pathParams?.code ?? config?.widgetConfig?.id) as
    | string
    | number
    | undefined;
  const idFromPath = pathname?.split("/").filter(Boolean)[1];
  const id = idFromConfig ?? idFromPath;

  const ssrProduct = (data?.product as Record<string, unknown>)?.["detail"] as Product | undefined;

  const [product, setProduct] = useState<Product | null>(ssrProduct ?? null);
  const [loading, setLoading] = useState(!ssrProduct);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "reviews" | "questions">(
    "description"
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);

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
          setError("محصول یافت نشد یا دسترسی به آن ندارید.");
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
    const first =
      product.main_image?.file ||
      product.list_images?.[0]?.file ||
      null;
    setSelectedImage(first);
  }, [product]);

  useEffect(() => {
    // Lightweight related products (visual parity with template).
    let mounted = true;
    productApi
      .list({ page_size: 5 })
      .then((res) => {
        if (!mounted) return;
        setRelated(res.results ?? []);
      })
      .catch(() => {
        if (!mounted) return;
        setRelated([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const sellPrice = product ? parseFloat(product.sell_price) : 0;
  const originalPrice = product ? parseFloat(product.price) : 0;
  const hasDiscount = product ? originalPrice > sellPrice : false;

  const images = useMemo(() => {
    if (!product) return [];
    const list: string[] = [];
    const main = product.main_image?.file;
    if (main) list.push(main);
    for (const img of product.list_images ?? []) {
      if (img?.file && !list.includes(img.file)) list.push(img.file);
    }
    return list.length ? list : ["https://via.placeholder.com/600x600?text=بدون+تصویر"];
  }, [product]);

  const mainImage = selectedImage ?? images[0] ?? "https://via.placeholder.com/600x600?text=بدون+تصویر";

  if (!id) {
    return (
      <section className="container py-12">
        <div className="bg-white rounded-xl p-6 text-gray-600">شناسه محصول مشخص نشده است.</div>
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

  if (error || !product) {
    return (
      <section className="container py-12">
        <div className="bg-white rounded-xl p-6">
          <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-4">{error ?? "محصول یافت نشد."}</div>
          <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
            بازگشت به فروشگاه
          </Link>
        </div>
      </section>
    );
  }

  const onAddToBasket = async () => {
    if (!isAuthenticated) {
      const current = `${pathname ?? ""}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
      router.push(`/login?next=${encodeURIComponent(current)}`);
      return;
    }
    setAdding(true);
    try {
      await basketApi.addItem(String(product.id), null, 1);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm font-medium text-gray-500 overflow-x-auto whitespace-nowrap pb-1">
            <Link href="/" className="hover:text-primary transition">
              خانه
            </Link>
            <span className="opacity-50">‹</span>
            <Link href="/products/search" className="hover:text-primary transition">
              محصولات
            </Link>
            <span className="opacity-50">‹</span>
            <span className="text-dark font-bold">{product.title}</span>
          </nav>
        </div>
      </div>

      {/* Product Detail Section */}
      <section className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
          {/* Images */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sticky top-28 border border-gray-100 shadow-sm">
              <div className="rounded-2xl overflow-hidden mb-6 bg-gray-50 border border-gray-100 relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mainImage}
                  alt={product.title}
                  className="w-full h-auto mix-blend-multiply transition duration-500"
                />
                {hasDiscount ? (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-sm">
                      پیشنهاد ویژه
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-5 gap-3">
                {images.slice(0, 5).map((img, idx) => {
                  const active = img === mainImage;
                  return (
                    <button
                      type="button"
                      key={`${img}-${idx}`}
                      className={
                        active
                          ? "border-2 border-primary rounded-xl overflow-hidden p-1 bg-white hover:border-primary transition"
                          : "border-2 border-transparent rounded-xl overflow-hidden p-1 bg-gray-50 hover:bg-white hover:border-gray-300 transition"
                      }
                      onClick={() => setSelectedImage(img)}
                      aria-label={`thumbnail-${idx + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full rounded-lg mix-blend-multiply" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
              <div className="mb-6 border-b border-gray-100 pb-6">
                <h1 className="text-2xl md:text-3xl font-black text-dark mb-4 leading-snug">{product.title}</h1>
                {(product.average_rating != null && product.reviews_count != null && product.reviews_count > 0) ? (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className={`text-sm ${parseFloat(String(product.average_rating)) >= i ? "opacity-100" : "opacity-30"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {parseFloat(String(product.average_rating)).toFixed(1)} ({product.reviews_count} نظر)
                    </span>
                  </div>
                ) : null}
                {product.short_description ? (
                  <p className="text-gray-500 text-sm leading-relaxed">{product.short_description}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Attributes placeholder */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h3 className="font-bold text-dark mb-3 text-sm">ویژگی‌های بارز</h3>
                    <ul className="space-y-2 text-xs font-medium text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                        کیفیت ساخت عالی
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                        ارسال سریع
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                        گارانتی معتبر
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Seller & Price */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/60">
                  <div className="flex items-center gap-2 mb-6 text-sm text-green-600 font-bold bg-green-50 px-3 py-2 rounded-lg inline-flex">
                    موجود در انبار
                  </div>

                  <div className="mb-6">
                    {hasDiscount ? (
                      <span className="text-gray-400 text-sm line-through block mb-1">
                        {formatPrice(originalPrice)}
                      </span>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black font-sans text-dark">{formatPrice(sellPrice)}</span>
                      <span className="text-sm font-bold text-gray-500">تومان</span>
                      {hasDiscount ? (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md mr-auto">
                          {Math.round(((originalPrice - sellPrice) / originalPrice) * 100)}%
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={onAddToBasket}
                      disabled={adding}
                      className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-60"
                    >
                      {adding ? "در حال افزودن..." : "افزودن به سبد خرید"}
                    </button>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl font-bold hover:border-red-500 hover:text-red-500 transition text-sm"
                      >
                        علاقه‌مندی
                      </button>
                      <button
                        type="button"
                        className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl font-bold hover:border-primary hover:text-primary transition text-sm"
                      >
                        اشتراک
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
                {[
                  { t: "ارسال سریع", c: "bg-green-50 text-green-600" },
                  { t: "ضمانت اصل بودن", c: "bg-blue-50 text-primary" },
                  { t: "۷ روز بازگشت", c: "bg-orange-50 text-orange-500" },
                  { t: "پرداخت در محل", c: "bg-purple-50 text-purple-500" },
                ].map((x) => (
                  <div key={x.t} className="flex flex-col items-center text-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${x.c} mb-1`}>
                      <span className="text-sm font-black">✓</span>
                    </div>
                    <span className="text-xs font-bold text-dark">{x.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50">
              <div className="px-6">
                <div className="flex gap-8 overflow-x-auto no-scrollbar">
                  {[
                    { id: "description", label: "توضیحات محصول" },
                    { id: "specifications", label: "مشخصات فنی" },
                    { id: "reviews", label: "نظرات کاربران" },
                    { id: "questions", label: "پرسش و پاسخ" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={
                        activeTab === (t.id as any)
                          ? "py-5 font-bold text-base whitespace-nowrap transition text-primary border-b-2 border-primary"
                          : "py-5 font-bold text-base whitespace-nowrap transition text-gray-500 hover:text-primary border-b-2 border-transparent"
                      }
                      onClick={() => setActiveTab(t.id as any)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10">
              {activeTab === "description" ? (
                <div className="prose max-w-none text-gray-600 leading-loose">
                  <div dangerouslySetInnerHTML={{ __html: product.description || "<p>توضیحی ثبت نشده است.</p>" }} />
                </div>
              ) : null}

              {activeTab === "specifications" ? (
                <div>
                  <h3 className="text-xl font-black text-dark mb-8">مشخصات فنی کامل</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div>
                      <h4 className="font-bold text-primary text-lg mb-4 pb-2 border-b border-gray-100">مشخصات کلی</h4>
                      <ul className="space-y-4 text-sm">
                        <li className="grid grid-cols-3">
                          <span className="text-gray-400 col-span-1">شناسه</span>
                          <span className="text-dark font-bold col-span-2">{String(product.id)}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "reviews" ? (
                <ProductReviews
                  productId={product.id}
                  product={product}
                  variant="serva"
                  onReviewSubmitted={() =>
                    productApi.get(id!).then((p) => {
                      setProduct(p);
                      setData("product.detail", p);
                    })
                  }
                />
              ) : null}

              {activeTab === "questions" ? (
                <div className="text-center py-10 text-gray-500">
                  <p>هنوز پرسشی ثبت نشده است.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      <section className="container pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-dark">محصولات مشابه</h2>
          <Link href="/products/search" className="text-primary font-bold hover:gap-2 transition-all flex items-center gap-1 text-sm">
            مشاهده همه <span aria-hidden>←</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {related.map((p) => {
            const img = p.main_image?.file || p.list_images?.[0]?.file || "https://via.placeholder.com/400x400?text=بدون+تصویر";
            return (
              <div key={p.id} className="group bg-white rounded-2xl p-4 border border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                <div className="relative aspect-square mb-3 bg-gray-50 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={p.title} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition" />
                </div>
                <h3 className="font-bold text-dark text-xs md:text-sm line-clamp-2 mb-2 group-hover:text-primary transition">
                  <Link href={`/product/${p.id}`}>{p.title}</Link>
                </h3>
                <div className="flex items-center gap-1 text-primary font-bold font-sans text-sm">
                  <span>{formatPrice(parseFloat(p.sell_price))}</span>
                  <span className="text-xs text-gray-500">تومان</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
