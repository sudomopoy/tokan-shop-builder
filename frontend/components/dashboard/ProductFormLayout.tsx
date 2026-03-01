"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Film, X, Plus } from "lucide-react";
import type { Media } from "@/lib/api/productApi";
import type { FormVariant } from "./ProductVariantSection";
import { ProductImageFields } from "./ProductImageFields";
import { ProductVariantSection } from "./ProductVariantSection";
import { CustomInputDefinitionsEditor } from "./CustomInputDefinitionsEditor";
import { DownloadableFilesEditor, type DownloadableFileEntry } from "./DownloadableFilesEditor";
import { RichTextEditor } from "./RichTextEditor";
import { FileManagerModal } from "@/components/FileManagerModal";
import type { Category } from "@/lib/api/categoryApi";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
function getMediaUrl(media: Media): string {
  const f = media.file;
  if (!f) return "";
  if (String(f).startsWith("http")) return String(f);
  return `${API_BASE.replace(/\/$/, "")}${String(f).startsWith("/") ? "" : "/"}${String(f)}`;
}

function StreamingVideoField({ value, onChange }: { value: Media | null; onChange: (m: Media | null) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <Film className="w-8 h-8 text-gray-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{value.title || value.original_filename}</p>
          </div>
          <button type="button" onClick={() => onChange(null)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
            <X className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setOpen(true)} className="text-sm text-blue-600 hover:underline">
            تغییر
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition"
        >
          <FolderOpen className="w-8 h-8 text-gray-400" />
          <span className="text-sm text-gray-600">{tFrontendAuto("fe.6c3eaaaede0f")}</span>
        </button>
      )}
      <p className="text-xs text-gray-500">{tFrontendAuto("fe.e29663785b13")}</p>
      <FileManagerModal open={open} onClose={() => setOpen(false)} onSelect={(m) => { onChange(m); setOpen(false); }} mode="single" accept="video" />
    </div>
  );
}

const inputClass =
  "w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

type ProductFormLayoutProps = {
  storeCategorySlug?: string | null;
  productType?: "physical" | "digital";
  digitalSubtype?: string;
  onDigitalSubtypeChange?: (v: string) => void;
  customInputDefinitions?: Record<string, unknown>[];
  onCustomInputDefinitionsChange?: (v: Record<string, unknown>[]) => void;
  downloadableFiles?: DownloadableFileEntry[];
  onDownloadableFilesChange?: (items: DownloadableFileEntry[]) => void;
  streamingSource?: "external_link" | "uploaded";
  onStreamingSourceChange?: (v: "external_link" | "uploaded") => void;
  streamingUrl?: string;
  onStreamingUrlChange?: (v: string) => void;
  streamingVideo?: Media | null;
  onStreamingVideoChange?: (m: Media | null) => void;
  // Left column
  mainImage: Media | null;
  galleryImages: Media[];
  onMainImageChange: (m: Media | null) => void;
  onGalleryChange: (imgs: Media[]) => void;
  isActive: boolean;
  onIsActiveChange: (v: boolean) => void;
  categories: string[];
  onCategoriesChange: (v: string[]) => void;
  categoriesTree: Category[];
  onCreateCategory?: (name: string) => Promise<void>;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: { id: string; name: string }[];
  onCreateTag?: (name: string) => Promise<void>;
  // Right column
  title: string;
  onTitleChange: (v: string) => void;
  shortDescription: string;
  onShortDescriptionChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  price: string;
  onPriceChange: (v: string) => void;
  sellPrice: string;
  onSellPriceChange: (v: string) => void;
  stock: string;
  onStockChange: (v: string) => void;
  stockUnlimited?: boolean;
  onStockUnlimitedChange?: (v: boolean) => void;
  formVariants: FormVariant[];
  onFormVariantsChange: (v: FormVariant[]) => void;
  hasVariantsEnabled: boolean;
  onHasVariantsEnabledChange: (v: boolean) => void;
  existingVariants?: unknown[];
};

function ProductCategoryCheckbox({
  cat,
  depth,
  selectedIds,
  onToggle,
}: {
  cat: Category;
  depth: number;
  selectedIds: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
}) {
  const hasSelectedDescendant = (c: Category): boolean =>
    selectedIds.has(c.id) || (c.children?.some((ch) => hasSelectedDescendant(ch)) ?? false);
  const isChecked = selectedIds.has(cat.id) || hasSelectedDescendant(cat);

  return (
    <div key={cat.id} className="space-y-1" style={{ paddingRight: depth * 12 }}>
      <label className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1">
        <input
          type="checkbox"
          checked={!!isChecked}
          onChange={(e) => onToggle(cat.id, e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600"
        />
        <span className="text-sm">
          {depth > 0 && <span className="text-gray-400 ml-1">↳ </span>}
          {cat.name}
        </span>
      </label>
      {cat.children?.length
        ? cat.children.map((child) => (
            <ProductCategoryCheckbox
              key={child.id}
              cat={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              onToggle={onToggle}
            />
          ))
        : null}
    </div>
  );
}

function CategorySection({
  categories,
  onCategoriesChange,
  categoriesTree,
  onCreateCategory,
}: {
  categories: string[];
  onCategoriesChange: (v: string[]) => void;
  categoriesTree: Category[];
  onCreateCategory?: (name: string) => Promise<void>;
}) {
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const selectedSet = new Set(categories);

  const findCategoryById = (tree: Category[], targetId: string): Category | null => {
    for (const c of tree) {
      if (c.id === targetId) return c;
      const found = c.children && findCategoryById(c.children, targetId);
      if (found) return found;
    }
    return null;
  };
  const getDescendantIds = (c: Category): string[] =>
    [c.id, ...(c.children?.flatMap((ch) => getDescendantIds(ch)) ?? [])];

  const handleCategoryToggle = (id: string, checked: boolean) => {
    if (checked) {
      onCategoriesChange([...categories, id]);
    } else {
      const cat = findCategoryById(categoriesTree, id);
      const toRemove = cat ? getDescendantIds(cat) : [id];
      onCategoriesChange(categories.filter((c) => !toRemove.includes(c)));
    }
  };

  const handleCreateCategory = async () => {
    const name = newCatName.trim();
    if (!name || !onCreateCategory) return;
    setCreatingCat(true);
    try {
      await onCreateCategory(name);
      setNewCatName("");
    } finally {
      setCreatingCat(false);
    }
  };

  return (
    <section className="card p-4 space-y-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{tFrontendAuto("fe.b045980215b7")}</h3>
      <div>
        <label className={labelClass}>{tFrontendAuto("fe.90418a312e66")}</label>
        <p className="text-xs text-gray-500 mb-2">
          با انتخاب هر دسته، تمام دسته‌های والد آن به‌صورت خودکار اضافه می‌شوند.
        </p>
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-0">
          {categoriesTree.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">{tFrontendAuto("fe.f460f71ab096")}</p>
          ) : (
            categoriesTree.map((c) => (
              <ProductCategoryCheckbox
                key={c.id}
                cat={c}
                depth={0}
                selectedIds={selectedSet}
                onToggle={handleCategoryToggle}
              />
            ))
          )}
        </div>
        {onCreateCategory && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateCategory())}
              placeholder={tFrontendAuto("fe.c7519b499eb4")}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={creatingCat}
            />
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={!newCatName.trim() || creatingCat}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              ایجاد
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function TagSection({
  tags,
  onTagsChange,
  allTags,
  onCreateTag,
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: { id: string; name: string }[];
  onCreateTag?: (name: string) => Promise<void>;
}) {
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);

  const handleToggle = (id: string) => {
    if (tags.includes(id)) {
      onTagsChange(tags.filter((t) => t !== id));
    } else {
      onTagsChange([...tags, id]);
    }
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name || !onCreateTag) return;
    setCreatingTag(true);
    try {
      await onCreateTag(name);
      setNewTagName("");
    } finally {
      setCreatingTag(false);
    }
  };

  return (
    <section className="card p-4 space-y-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{tFrontendAuto("fe.3222ea2c45bc")}</h3>
      <div>
        <label className={labelClass}>{tFrontendAuto("fe.6f5117d1cbdb")}</label>
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-0">
          {allTags.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">{tFrontendAuto("fe.444bbd3acef0")}</p>
          ) : (
            allTags.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-2 py-2 px-1 cursor-pointer hover:bg-gray-50 rounded"
              >
                <input
                  type="checkbox"
                  checked={tags.includes(t.id)}
                  onChange={() => handleToggle(t.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm">{t.name}</span>
              </label>
            ))
          )}
        </div>
        {onCreateTag && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateTag())}
              placeholder={tFrontendAuto("fe.f8e2d7a6513e")}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={creatingTag}
            />
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || creatingTag}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              ایجاد
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/** استریمینگ فقط برای فروشگاه‌های استریمینگ. بقیه: دانلودی، ثبت درخواست */
function getDigitalSubtypes(storeCategorySlug: string | null | undefined) {
  const base = [
    { value: "downloadable", label: "دانلودی" },
    { value: "request_only", label: "ثبت درخواست" },
  ] as const;
  if (storeCategorySlug === "streaming") {
    return [
      { value: "streaming", label: "استریمینگ" },
      ...base,
    ];
  }
  return base;
}

export function ProductFormLayout({
  storeCategorySlug,
  productType,
  digitalSubtype,
  onDigitalSubtypeChange,
  customInputDefinitions = [],
  onCustomInputDefinitionsChange,
  downloadableFiles = [],
  onDownloadableFilesChange,
  streamingSource = "external_link",
  onStreamingSourceChange,
  streamingUrl,
  onStreamingUrlChange,
  streamingVideo,
  onStreamingVideoChange,
  mainImage,
  galleryImages,
  onMainImageChange,
  onGalleryChange,
  isActive,
  onIsActiveChange,
  categories,
  onCategoriesChange,
  categoriesTree,
  onCreateCategory,
  tags,
  onTagsChange,
  allTags,
  onCreateTag,
  title,
  onTitleChange,
  shortDescription,
  onShortDescriptionChange,
  description,
  onDescriptionChange,
  price,
  onPriceChange,
  sellPrice,
  onSellPriceChange,
  stock,
  onStockChange,
  stockUnlimited = false,
  onStockUnlimitedChange,
  formVariants,
  onFormVariantsChange,
  hasVariantsEnabled,
  onHasVariantsEnabledChange,
  existingVariants = [],
}: ProductFormLayoutProps) {
  const isDigital = ["digital", "download", "streaming"].includes(storeCategorySlug ?? "") || productType === "digital";
  const hasVariants = hasVariantsEnabled && formVariants.length > 0;
  const computedFromVariants = hasVariants
    ? (() => {
        const prices = formVariants.map((v) => parseFloat(v.price) || 0);
        const sellPrices = formVariants.map((v) => parseFloat(v.sell_price) || 0);
        const anyUnlimited = formVariants.some((v) => v.stock_unlimited);
        const stocks = formVariants.map((v) => v.stock_unlimited ? 0 : (v.stock ?? 0));
        return {
          price: String(Math.min(...prices)),
          sellPrice: String(Math.min(...sellPrices)),
          stock: anyUnlimited ? "" : String(stocks.reduce((a, b) => a + b, 0)),
          stockUnlimited: anyUnlimited,
        };
      })()
    : null;

  /** وقتی تنوع‌ها فعال‌اند، مقادیر محاسبه‌شده را به فرم والد همگام کن */
  useEffect(() => {
    if (hasVariants && computedFromVariants) {
      onPriceChange(computedFromVariants.price);
      onSellPriceChange(computedFromVariants.sellPrice);
      onStockChange(computedFromVariants.stock);
      onStockUnlimitedChange?.(computedFromVariants.stockUnlimited ?? false);
    }
  }, [hasVariants, formVariants]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left column */}
      <aside className="lg:col-span-1 space-y-6 order-2 lg:order-1">
        {/* Images */}
        <section className="card p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-4">{tFrontendAuto("fe.2467aa45516f")}</h3>
          <ProductImageFields
            mainImage={mainImage}
            galleryImages={galleryImages}
            onMainImageChange={onMainImageChange}
            onGalleryChange={onGalleryChange}
          />
        </section>

        {/* Category section */}
        <CategorySection
          categories={categories}
          onCategoriesChange={onCategoriesChange}
          categoriesTree={categoriesTree}
          onCreateCategory={onCreateCategory}
        />

        {/* Tags section */}
        <TagSection
          tags={tags}
          onTagsChange={onTagsChange}
          allTags={allTags}
          onCreateTag={onCreateTag}
        />

        {/* Publish & Organization */}
        <section className="card p-4 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            انتشار و سازماندهی
          </h3>

          {/* Publish status */}
          <div>
            <label className={labelClass}>{tFrontendAuto("fe.565f50d0ee7c")}</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => onIsActiveChange(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {isActive ? "منتشر شده" : "پیش‌نویس"}
              </span>
            </label>
          </div>
        </section>
      </aside>

      {/* Right column */}
      <main className="lg:col-span-2 space-y-6 order-1 lg:order-2">
        {/* Title & Descriptions */}
        <section className="card p-4 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            اطلاعات محصول
          </h3>

          <div>
            <label className={labelClass}>{tFrontendAuto("fe.a83c261c5577")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              required
              className={inputClass}
              placeholder={tFrontendAuto("fe.7327fc94fbca")}
            />
          </div>

          <div>
            <label className={labelClass}>{tFrontendAuto("fe.cd07f2cfe6a9")}</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => onShortDescriptionChange(e.target.value)}
              className={inputClass}
              placeholder={tFrontendAuto("fe.599a024ea25f")}
            />
          </div>

          <div>
            <label className={labelClass}>{tFrontendAuto("fe.8593a9f18909")}</label>
            <RichTextEditor
              value={description}
              onChange={onDescriptionChange}
              placeholder={tFrontendAuto("fe.7430ff841b29")}
            />
          </div>
        </section>

        {/* Price & Stock */}
        <section className="card p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            قیمت و موجودی
          </h3>
          {hasVariantsEnabled && (
            <p className="text-sm text-gray-500 mb-3">
              {hasVariants
                ? "با توجه به تنوع‌های تعریف‌شده، قیمت و موجودی از تنوع‌ها خوانده می‌شود (کمترین قیمت، مجموع موجودی)."
                : "قیمت و موجودی از تنوع‌ها خوانده می‌شود. لطفاً تنوع‌ها را تعریف کنید."}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{tFrontendAuto("fe.b8f408dfd74d")}</label>
              <input
                type="number"
                min="0"
                value={hasVariants ? computedFromVariants!.price : price}
                onChange={(e) => onPriceChange(e.target.value)}
                disabled={hasVariantsEnabled}
                readOnly={hasVariantsEnabled}
                className={`${inputClass} ${hasVariantsEnabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
            </div>
            <div>
              <label className={labelClass}>{tFrontendAuto("fe.aeed5d507cf3")}</label>
              <input
                type="number"
                min="0"
                value={hasVariants ? computedFromVariants!.sellPrice : sellPrice}
                onChange={(e) => onSellPriceChange(e.target.value)}
                disabled={hasVariantsEnabled}
                readOnly={hasVariantsEnabled}
                className={`${inputClass} ${hasVariantsEnabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
            </div>
            <div>
              <label className={labelClass}>{tFrontendAuto("fe.f02d402cab22")}</label>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVariants ? computedFromVariants!.stockUnlimited : stockUnlimited}
                  onChange={(e) => !hasVariantsEnabled && onStockUnlimitedChange?.(e.target.checked)}
                  disabled={hasVariantsEnabled}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60"
                />
                <span className="text-sm text-gray-700">{tFrontendAuto("fe.5bdae7e630f6")}</span>
              </label>
              <input
                type="number"
                min="0"
                value={hasVariants ? computedFromVariants!.stock : stock}
                onChange={(e) => onStockChange(e.target.value)}
                disabled={hasVariantsEnabled || stockUnlimited || computedFromVariants?.stockUnlimited}
                readOnly={hasVariantsEnabled || stockUnlimited || computedFromVariants?.stockUnlimited}
                placeholder={(stockUnlimited || computedFromVariants?.stockUnlimited) ? "∞ نامحدود" : undefined}
                className={`${inputClass} ${(hasVariantsEnabled || stockUnlimited || computedFromVariants?.stockUnlimited) ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
            </div>
          </div>
        </section>

        {/* Digital product fields */}
        {isDigital && (
          <section className="card p-4 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">{tFrontendAuto("fe.8bf0524ba66b")}</h3>
            {onDigitalSubtypeChange && (
              <div>
                <label className={labelClass}>{tFrontendAuto("fe.a2237d4603e2")}</label>
                <select
                  value={digitalSubtype ?? ""}
                  onChange={(e) => onDigitalSubtypeChange(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{tFrontendAuto("fe.b3128f65dc93")}</option>
                  {getDigitalSubtypes(storeCategorySlug).map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {digitalSubtype === "downloadable" && onDownloadableFilesChange && (
              <div>
                <DownloadableFilesEditor
                  value={downloadableFiles}
                  onChange={onDownloadableFilesChange}
                />
              </div>
            )}
            {digitalSubtype === "streaming" && (
              <>
                {onStreamingSourceChange && (
                  <div>
                    <label className={labelClass}>{tFrontendAuto("fe.37b004a90294")}</label>
                    <select
                      value={streamingSource ?? "external_link"}
                      onChange={(e) => onStreamingSourceChange(e.target.value as "external_link" | "uploaded")}
                      className={inputClass}
                    >
                      <option value="external_link">{tFrontendAuto("fe.de9268593609")}</option>
                      <option value="uploaded">{tFrontendAuto("fe.61ed3dafd614")}</option>
                    </select>
                  </div>
                )}
                {streamingSource === "external_link" && onStreamingUrlChange && (
                  <div>
                    <label className={labelClass}>{tFrontendAuto("fe.5decfea09f74")}</label>
                    <input
                      type="url"
                      value={streamingUrl ?? ""}
                      onChange={(e) => onStreamingUrlChange(e.target.value)}
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </div>
                )}
                {streamingSource === "uploaded" && onStreamingVideoChange && (
                  <div>
                    <label className={labelClass}>{tFrontendAuto("fe.e0d9ce1d712e")}</label>
                    <StreamingVideoField
                      value={streamingVideo}
                      onChange={onStreamingVideoChange}
                    />
                  </div>
                )}
              </>
            )}
            {onCustomInputDefinitionsChange && (
              <div>
                <CustomInputDefinitionsEditor
                  value={customInputDefinitions ?? []}
                  onChange={onCustomInputDefinitionsChange}
                />
              </div>
            )}
          </section>
        )}

        {/* Variants toggle & section - hidden for digital */}
        {!isDigital && (
        <section className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              انواع ویژگی‌ها و تنوع‌ها
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-700">{tFrontendAuto("fe.07ae2a817ebe")}</span>
              <input
                type="checkbox"
                checked={hasVariantsEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  onHasVariantsEnabledChange(checked);
                  if (!checked) onFormVariantsChange([]);
                }}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
          {hasVariantsEnabled && (
            <ProductVariantSection
              variants={formVariants}
              onChange={onFormVariantsChange}
              existingVariants={existingVariants as any}
              productPrice={price}
              productSellPrice={sellPrice}
            />
          )}
        </section>
        )}
      </main>
    </div>
  );
}
