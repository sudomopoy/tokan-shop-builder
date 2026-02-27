"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { WidgetConfig } from "@/themes/types";
import { productApi, basketApi, type Product } from "@/lib/api";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faHeart, faPlus, faStar } from "@fortawesome/free-solid-svg-icons";

const formatPrice = (price: number): string => new Intl.NumberFormat("fa-IR").format(price);

const slugify = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "product";

type ProductCardData = {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  imageUrl: string;
  inStock: boolean;
  badge: string | null;
  averageRating: number;
  reviewsCount: number;
};

function mapProduct(product: Product): ProductCardData {
  const sell = parseFloat(product.sell_price);
  const original = parseFloat(product.price);
  const hasDiscount = original > sell;
  const discountPercent = hasDiscount ? Math.round(((original - sell) / original) * 100) : 0;
  const imageUrl =
    product.main_image?.file ||
    product.list_images?.[0]?.file ||
    "https://via.placeholder.com/600x600?text=بدون+تصویر";

  const inStock = product.stock_unlimited || (product.stock ?? 0) > 0;
  let badge: string | null = null;
  if (inStock && product.soled > 10) badge = "پرفروش";
  if (inStock && discountPercent >= 15) badge = "تخفیف ویژه";

  const avgRating = product.average_rating != null
    ? parseFloat(String(product.average_rating))
    : 4.5;
  const reviewsCount = product.reviews_count ?? 0;

  return {
    id: product.id,
    title: product.title,
    price: sell,
    originalPrice: original,
    discountPercent,
    imageUrl,
    inStock,
    badge,
    averageRating: avgRating,
    reviewsCount,
  };
}

function ProductCard({
  product,
  onAddToBasket,
  adding,
}: {
  product: ProductCardData;
  onAddToBasket: (id: string) => void;
  adding: boolean;
}) {
  const hasDiscount = product.originalPrice > product.price;
  const url = `/product/${product.id}/${slugify(product.title)}`;

  return (
    <div className="group bg-white rounded-3xl p-4 border border-transparent hover:border-primary/20 hover:shadow-2xl transition-all duration-300 relative flex flex-col">
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {hasDiscount ? (
          <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm shadow-red-200">
            {product.discountPercent}%
          </span>
        ) : product.badge ? (
          <span className="bg-secondary text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="relative aspect-square mb-4 overflow-hidden rounded-2xl bg-gray-50 group-hover:bg-white transition-colors">
        <Link href={url} className="block w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition duration-500"
          />
        </Link>

        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition duration-300">
          <button
            type="button"
            className="w-10 h-10 bg-white text-gray-500 rounded-xl shadow-lg hover:bg-primary hover:text-white transition flex items-center justify-center"
            title="افزودن به علاقه‌مندی"
            aria-label="favorite"
          >
            <FontAwesomeIcon icon={faHeart} />
          </button>
          <Link
            href={url}
            className="w-10 h-10 bg-white text-gray-500 rounded-xl shadow-lg hover:bg-primary hover:text-white transition flex items-center justify-center"
            title="مشاهده"
            aria-label="view"
          >
            <FontAwesomeIcon icon={faEye} />
          </Link>
        </div>

        {!product.inStock ? (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-sm">
              ناموجود
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="text-xs text-gray-400 mb-2 font-medium">محصول</div>

        <h3 className="font-bold font-sans text-dark text-sm leading-relaxed mb-3 line-clamp-2 group-hover:text-primary transition cursor-pointer">
          <Link href={url}>{product.title}</Link>
        </h3>

        <div className="flex items-center gap-1 mb-4">
          <div className="flex text-amber-400 text-xs">
            {[1, 2, 3, 4, 5].map((i) => (
              <FontAwesomeIcon
                key={i}
                icon={faStar}
                className={product.averageRating >= i ? "" : "opacity-40"}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400 font-medium mt-0.5">
            ({product.averageRating > 0 ? product.averageRating.toFixed(1) : "-"})
            {product.reviewsCount > 0 ? ` • ${product.reviewsCount} نظر` : ""}
          </span>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            {hasDiscount ? (
              <span className="text-xs text-gray-400 line-through mb-0.5">
                {formatPrice(product.originalPrice)}
              </span>
            ) : null}
            <div className="flex items-center gap-1 text-primary font-black font-sans text-lg">
              <span>{formatPrice(product.price)}</span>
              <span className="text-xs font-normal text-gray-500">تومان</span>
            </div>
          </div>

          <button
            type="button"
            disabled={!product.inStock || adding}
            onClick={() => onAddToBasket(product.id)}
            className="w-11 h-11 rounded-xl bg-gray-50 text-primary hover:bg-primary hover:text-white transition flex items-center justify-center group/btn disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="add to basket"
          >
            <FontAwesomeIcon icon={faPlus} className="transition-transform group-hover/btn:rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsListView({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data } = usePageRuntime();

  const title = (config?.widgetConfig?.title as string) || "منتخب محصولات";
  const subtitle =
    (config?.widgetConfig?.subtitle as string) || "بهترین کالاها با بالاترین کیفیت برای شما";
  const pageSize = Number(config?.widgetConfig?.page_size ?? 8) || 8;

  const ssrList = (data?.product as Record<string, unknown>)?.["listview"] as { results?: Product[] } | undefined;
  const ssrProducts = ssrList?.results ?? [];

  const [loading, setLoading] = useState(!ssrProducts.length);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductCardData[]>(() =>
    ssrProducts.length ? ssrProducts.map(mapProduct) : []
  );
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (ssrProducts.length > 0) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    productApi
      .list({ page_size: pageSize })
      .then((res) => {
        if (!mounted) return;
        const items = (res.results ?? []).map(mapProduct);
        setProducts(items);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setError("خطا در بارگذاری محصولات.");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [pageSize, ssrProducts.length]);

  const addToBasket = async (id: string) => {
    if (!isAuthenticated) {
      const current = `${pathname ?? ""}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
      router.push(`/login?next=${encodeURIComponent(current)}`);
      return;
    }
    setAddingId(id);
    try {
      await basketApi.addItem(id, null, 1);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section className="container">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black font-sans text-dark mb-2">{title}</h2>
          <p className="text-gray-500 text-sm font-medium">{subtitle}</p>
        </div>
        <Link href="/products/search" className="text-primary font-bold hover:gap-2 transition-all flex items-center gap-1 text-sm">
          مشاهده همه <span aria-hidden>←</span>
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500">در حال بارگذاری...</div>
      ) : error ? (
        <div className="bg-white rounded-2xl p-8 text-center text-red-600">{error}</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500">محصولی یافت نشد.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAddToBasket={addToBasket} adding={addingId === p.id} />
          ))}
        </div>
      )}
    </section>
  );
}
