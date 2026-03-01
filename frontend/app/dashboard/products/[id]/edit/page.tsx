"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  productApi,
  categoryApi,
  tagApi,
  storeApi,
} from "@/lib/api";
import type { Product } from "@/lib/api/productApi";
import type { Media } from "@/lib/api/productApi";
import {
  ProductFormLayout,
} from "@/components/dashboard/ProductFormLayout";
import type { FormVariant } from "@/components/dashboard/ProductVariantSection";
import type { DownloadableFileEntry } from "@/components/dashboard/DownloadableFilesEditor";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [storeCategorySlug, setStoreCategorySlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<Media | null>(null);
  const [digitalSubtype, setDigitalSubtype] = useState("");
  const [customInputDefinitions, setCustomInputDefinitions] = useState<Record<string, unknown>[]>([]);
  const [downloadableFiles, setDownloadableFiles] = useState<DownloadableFileEntry[]>([]);
  const [streamingSource, setStreamingSource] = useState<"external_link" | "uploaded">("external_link");
  const [streamingUrl, setStreamingUrl] = useState("");
  const [streamingVideo, setStreamingVideo] = useState<Media | null>(null);
  const [galleryImages, setGalleryImages] = useState<Media[]>([]);
  const [formVariants, setFormVariants] = useState<FormVariant[]>([]);
  const [hasVariantsEnabled, setHasVariantsEnabled] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<
    import("@/lib/api/categoryApi").Category[]
  >([]);
  const [allTags, setAllTags] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    title: "",
    short_description: "",
    description: "",
    price: "",
    sell_price: "",
    stock: "0",
    stock_unlimited: false,
    categories: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    if (!id) return;
    storeApi.getCurrentStore().then((s) => setStoreCategorySlug(s?.store_category?.slug ?? null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      productApi.get(id),
      categoryApi.tree({ module: "STORE" }),
      tagApi.list().catch(() => []),
    ])
      .then(([p, catTree, tagsList]) => {
        setProduct(p);
        const prod = p as Product & { is_active?: boolean };
        const pExt = p as Product & { stock_unlimited?: boolean };
        setForm({
          title: p.title,
          short_description: p.short_description || "",
          description: p.description || "",
          price: p.price || "",
          sell_price: p.sell_price || p.price || "",
          stock: String(p.stock ?? 0),
          stock_unlimited: pExt.stock_unlimited ?? false,
          categories: (p.categories ?? []).map((c: { id: string }) => c.id),
          is_active: prod.is_active !== false,
        });
        setTags((p.tags ?? []).map((t: { id: string }) => t.id));
        setMainImage(p.main_image ?? null);
        setGalleryImages(p.list_images ?? []);
        const prodExt = p as Product & { digital_subtype?: string; custom_input_definitions?: unknown[]; downloadable_files?: DownloadableFileEntry[]; streaming_url?: string };
        setDigitalSubtype(prodExt.digital_subtype ?? "");
        setCustomInputDefinitions((prodExt.custom_input_definitions ?? []) as Record<string, unknown>[]);
        setDownloadableFiles((prodExt.downloadable_files ?? []).map((f: { media_id: string; title?: string; description?: string }) => ({
          media_id: f.media_id,
          title: f.title ?? "",
          description: f.description ?? "",
        })));
        setStreamingSource((prodExt.streaming_source as "external_link" | "uploaded") ?? "external_link");
        setStreamingUrl(prodExt.streaming_url ?? "");
        setStreamingVideo((prodExt as any).streaming_video ?? null);
        setAllTags(
          (tagsList as { id: string; name: string }[]).map((t) => ({
            id: t.id,
            name: t.name,
          }))
        );
        const variantList = (p.variants ?? []).map((v: any) => ({
          id: v.id,
          price: v.price ?? "0",
          sell_price: v.sell_price ?? v.price ?? "0",
          stock: v.stock ?? 0,
          stock_unlimited: v.stock_unlimited ?? false,
          selections: (v.attribute_values ?? [])
            .filter((av: any) => av?.attribute?.id && av?.value?.id)
            .map((av: any) => ({
              attribute_id: av.attribute.id,
              value_id: av.value.id,
            })),
        }));
        setFormVariants(variantList);
        setHasVariantsEnabled(variantList.length > 0);
        const filtered =
          Array.isArray(catTree) && catTree.length > 0
            ? (catTree as import("@/lib/api/categoryApi").Category[]).filter(
                (c) => c.module === "STORE"
              )
            : [];
        setCategories(filtered);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCreateCategory = async (name: string) => {
    const cat = await categoryApi.create({ name, module: "STORE" });
    const newTree = await categoryApi.tree({ module: "STORE" });
    const filtered = Array.isArray(newTree) && newTree.length > 0
      ? (newTree as import("@/lib/api/categoryApi").Category[]).filter((c) => c.module === "STORE")
      : [];
    setCategories(filtered);
    setForm((f) => ({ ...f, categories: [...f.categories, cat.id] }));
  };

  const handleCreateTag = async (name: string) => {
    const tag = await tagApi.create({ name });
    setAllTags((prev) => [...prev, { id: tag.id, name: tag.name }]);
    setTags((prev) => [...prev, tag.id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setError(null);
    setSaving(true);
    try {
      const price = form.price ? Number(form.price) : 0;
      const sellPrice = form.sell_price ? Number(form.sell_price) : price;
      const stock = form.stock ? Number(form.stock) : 0;

      const isDigital = ["digital", "download", "streaming"].includes(storeCategorySlug ?? "");
      const payload: Record<string, unknown> = {
        title: form.title,
        short_description: form.short_description || "",
        description: form.description || "",
        price: String(price),
        sell_price: String(sellPrice),
        stock: isDigital ? 0 : (form.stock_unlimited ? 0 : stock),
        stock_unlimited: isDigital ? false : form.stock_unlimited,
        list_images: galleryImages.map((m) => m.id),
        is_active: form.is_active,
        product_type: isDigital ? "digital" : "physical",
        variants: isDigital ? [] : (hasVariantsEnabled ? formVariants.map((v) => ({
          ...(v.id && { id: v.id }),
          price: String(v.price),
          sell_price: String(v.sell_price),
          stock: v.stock_unlimited ? 0 : v.stock,
          stock_unlimited: v.stock_unlimited ?? false,
          selections: v.selections,
        })) : []),
      };
      if (form.categories.length > 0) payload.categories = form.categories;
      payload.main_image = mainImage?.id ?? null;
      payload.tags = tags;
      if (isDigital) {
        if (digitalSubtype) payload.digital_subtype = digitalSubtype;
        if (customInputDefinitions.length > 0) payload.custom_input_definitions = customInputDefinitions;
        if (downloadableFiles.length > 0) {
          payload.downloadable_files = downloadableFiles.map((f) => ({
            media_id: f.media_id,
            title: f.title || "",
            description: f.description || "",
          }));
        }
        if (digitalSubtype === "streaming") {
          payload.streaming_source = streamingSource;
          if (streamingSource === "external_link" && streamingUrl) payload.streaming_url = streamingUrl;
          if (streamingSource === "uploaded" && streamingVideo) payload.streaming_video = streamingVideo.id;
        }
      }

      await productApi.update(product.id, payload as any);
      router.push("/dashboard/products");
    } catch (err: any) {
      const msg =
        err.response?.data?.title?.[0] ||
        err.response?.data?.detail ||
        "خطا در بروزرسانی محصول";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !product) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/products"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowRight className="h-5 w-5" />
            بازگشت
          </Link>
          <h1 className="text-3xl font-bold">{tFrontendAuto("fe.025a6f4fe202")}</h1>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            form="product-form"
            disabled={saving || !form.title}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
          <Link href="/dashboard/products" className="btn-secondary">
            انصراف
          </Link>
        </div>
      </div>

      <form
        id="product-form"
        onSubmit={handleSubmit}
        className="w-full"
      >
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <ProductFormLayout
          storeCategorySlug={storeCategorySlug}
          productType={["digital", "download", "streaming"].includes(storeCategorySlug ?? "") ? "digital" : "physical"}
          digitalSubtype={digitalSubtype}
          onDigitalSubtypeChange={setDigitalSubtype}
          customInputDefinitions={customInputDefinitions}
          onCustomInputDefinitionsChange={setCustomInputDefinitions}
          downloadableFiles={downloadableFiles}
          onDownloadableFilesChange={setDownloadableFiles}
          streamingSource={streamingSource}
          onStreamingSourceChange={setStreamingSource}
          streamingUrl={streamingUrl}
          onStreamingUrlChange={setStreamingUrl}
          streamingVideo={streamingVideo}
          onStreamingVideoChange={setStreamingVideo}
          mainImage={mainImage}
          galleryImages={galleryImages}
          onMainImageChange={setMainImage}
          onGalleryChange={setGalleryImages}
          isActive={form.is_active}
          onIsActiveChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
          categories={form.categories}
          onCategoriesChange={(v) => setForm((f) => ({ ...f, categories: v }))}
          categoriesTree={categories}
          onCreateCategory={handleCreateCategory}
          tags={tags}
          onTagsChange={setTags}
          allTags={allTags}
          onCreateTag={handleCreateTag}
          title={form.title}
          onTitleChange={(v) => setForm((f) => ({ ...f, title: v }))}
          shortDescription={form.short_description}
          onShortDescriptionChange={(v) =>
            setForm((f) => ({ ...f, short_description: v }))
          }
          description={form.description}
          onDescriptionChange={(v) =>
            setForm((f) => ({ ...f, description: v }))
          }
          price={form.price}
          onPriceChange={(v) => setForm((f) => ({ ...f, price: v }))}
          sellPrice={form.sell_price}
          onSellPriceChange={(v) =>
            setForm((f) => ({ ...f, sell_price: v }))
          }
          stock={form.stock}
          onStockChange={(v) => setForm((f) => ({ ...f, stock: v }))}
          stockUnlimited={form.stock_unlimited}
          onStockUnlimitedChange={(v) => setForm((f) => ({ ...f, stock_unlimited: v }))}
          formVariants={formVariants}
          onFormVariantsChange={setFormVariants}
          hasVariantsEnabled={hasVariantsEnabled}
          onHasVariantsEnabledChange={setHasVariantsEnabled}
          existingVariants={product.variants ?? []}
        />
      </form>
    </div>
  );
}
