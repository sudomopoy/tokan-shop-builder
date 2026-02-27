"use client";

import { useState, useEffect } from "react";
import {
  Palette,
  ExternalLink,
  Check,
  Images,
  X,
  Lock,
  Sparkles,
  Info,
} from "lucide-react";
import { themeApi } from "@/lib/api";
import type { ThemeCatalog } from "@/lib/api/themeApi";

type ThemeSettingsSectionProps = {
  currentThemeSlug: string;
  onThemeChange: (slug: string) => void;
  onSave: (overrides?: { theme_slug?: string }) => Promise<void>;
};

export function ThemeSettingsSection({
  currentThemeSlug,
  onThemeChange,
  onSave,
}: ThemeSettingsSectionProps) {
  const [themes, setThemes] = useState<ThemeCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<ThemeCatalog | null>(null);

  useEffect(() => {
    themeApi.list().then(setThemes).finally(() => setLoading(false));
  }, []);

  const handleActivate = async (theme: ThemeCatalog) => {
    const slug =
      theme.slug_display ?? theme.slug ?? theme.name.toLowerCase().replace(/\s/g, "-");
    if (theme.is_paid) {
      return;
    }
    onThemeChange(slug);
    await onSave({ theme_slug: slug });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="p-2 rounded-lg bg-blue-100">
          <Palette className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">ظاهر و تم فروشگاه</h2>
          <p className="text-sm text-gray-500">
            تم مورد نظر خود را انتخاب کرده و فروشگاه را شخصی‌سازی کنید
          </p>
          <p className="text-xs text-amber-600 mt-2">
            اعمال تم جدید ممکن است تا ۱۰ دقیقه طول بکشد.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {themes.map((theme) => {
          const slug = theme.slug_display ?? theme.slug ?? "default";
          const isActive = currentThemeSlug === slug;

          return (
            <article
              key={theme.id}
              className={`group relative bg-white rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-lg ${
                isActive
                  ? "border-blue-500 shadow-md ring-2 ring-blue-100"
                  : "border-gray-200 hover:border-blue-200"
              }`}
            >
              {/* تصویر اصلی */}
              <div className="relative aspect-[5/3] bg-gray-100 overflow-hidden">
                {theme.thumbnail_url ? (
                  <img
                    src={theme.thumbnail_url}
                    alt={theme.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Palette className="h-16 w-16 text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2.5 right-2.5 flex gap-2">
                  {isActive && (
                    <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      فعال
                    </span>
                  )}
                  {theme.is_paid ? (
                    <span className="px-2.5 py-1 rounded-full bg-gray-700 text-white text-xs font-medium flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      {theme.price
                        ? `${Number(theme.price).toLocaleString("fa-IR")} تومان`
                        : "پولی"}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-medium">
                      رایگان
                    </span>
                  )}
                </div>
              </div>

              {/* محتوا */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-1">
                  {theme.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3 min-h-[2.5rem]">
                  {theme.description || "بدون توضیحات"}
                </p>

                {theme.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {theme.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTheme(theme)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  >
                    <Info className="h-4 w-4" />
                    جزئیات
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActivate(theme)}
                    disabled={isActive || theme.is_paid}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      isActive
                        ? "bg-blue-100 text-blue-700 cursor-default"
                        : theme.is_paid
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-blue text-white hover:opacity-90"
                    }`}
                  >
                    {theme.is_paid ? (
                      <Lock className="h-4 w-4" />
                    ) : isActive ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {theme.is_paid ? "پولی" : isActive ? "فعال" : "فعال‌سازی"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {selectedTheme && (
        <ThemeDetailModal
          theme={selectedTheme}
          isActive={currentThemeSlug === (selectedTheme.slug_display ?? selectedTheme.slug ?? "default")}
          onActivate={() => handleActivate(selectedTheme)}
          onClose={() => setSelectedTheme(null)}
        />
      )}
    </div>
  );
}

function ThemeDetailModal({
  theme,
  isActive,
  onActivate,
  onClose,
}: {
  theme: ThemeCatalog;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
}) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const gallery = theme.gallery_expanded ?? [];
  const currentGalleryItem = gallery[galleryIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* هدر */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">{theme.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* تصویر / گالری */}
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
            {currentGalleryItem?.url ? (
              <img
                src={currentGalleryItem.url}
                alt=""
                className="w-full h-full object-contain"
              />
            ) : theme.thumbnail_url ? (
              <img
                src={theme.thumbnail_url}
                alt={theme.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Palette className="h-20 w-20 text-gray-300" />
              </div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mt-2">
              {gallery.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setGalleryIndex(i)}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === galleryIndex ? "border-blue-500" : "border-gray-200"
                  }`}
                >
                  {item.url ? (
                    <img
                      src={item.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Images className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          {currentGalleryItem?.description && (
            <p className="text-sm text-gray-600 p-3 rounded-lg bg-gray-50">
              {currentGalleryItem.description}
            </p>
          )}

          {/* توضیحات */}
          {theme.description && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">توضیحات</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {theme.description}
              </p>
            </div>
          )}

          {/* مشخصات */}
          <div className="grid grid-cols-2 gap-3">
            {theme.category && (
              <div className="p-3 rounded-lg bg-gray-50">
                <span className="text-xs text-gray-500 block mb-0.5">دسته‌بندی</span>
                <span className="text-sm font-medium text-gray-800">{theme.category}</span>
              </div>
            )}
            {theme.tags?.length > 0 && (
              <div className="p-3 rounded-lg bg-gray-50 col-span-2">
                <span className="text-xs text-gray-500 block mb-2">تگ‌ها</span>
                <div className="flex flex-wrap gap-1.5">
                  {theme.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="p-3 rounded-lg bg-gray-50">
              <span className="text-xs text-gray-500 block mb-0.5">نوع</span>
              <span className="text-sm font-medium">
                {theme.is_paid
                  ? theme.price
                    ? `${Number(theme.price).toLocaleString("fa-IR")} تومان`
                    : "پولی"
                  : "رایگان"}
              </span>
            </div>
          </div>

        </div>

        {/* فوتر: مشاهده دمو + فعال‌سازی */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0 flex gap-3">
          {theme.demo_url && (
            <a
              href={theme.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-lg border-2 border-blue-500 text-blue-600 font-medium hover:bg-blue-50 transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
              مشاهده دمو
            </a>
          )}
          <button
            type="button"
            onClick={onActivate}
            disabled={isActive || theme.is_paid}
            className={`flex items-center justify-center gap-2 ${theme.demo_url ? "flex-1" : "w-full"} py-3 px-4 rounded-lg font-medium text-sm transition-all ${
              isActive
                ? "bg-blue-100 text-blue-700 cursor-default"
                : theme.is_paid
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gradient-blue text-white hover:opacity-90"
            }`}
          >
            {theme.is_paid ? (
              <>
                <Lock className="h-5 w-5" />
                نیاز به پرداخت
              </>
            ) : isActive ? (
              <>
                <Check className="h-5 w-5" />
                تم فعلی
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                فعال‌سازی این تم
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
