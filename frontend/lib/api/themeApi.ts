import { apiClient } from "./apiClient";

export type ThemeGalleryItem = {
  media_id: string | null;
  url: string | null;
  description: string;
};

export type ThemeCatalog = {
  id: string;
  name: string;
  slug: string | null;
  slug_display: string | null;
  description: string | null;
  thumbnail: string | null;
  thumbnail_url: string | null;
  gallery: Array<{ media_id?: string; description?: string }>;
  gallery_expanded: ThemeGalleryItem[];
  tags: string[];
  category: string | null;
  is_paid: boolean;
  price: string | number | null;
  demo_url: string | null;
  is_active: boolean;
};

const DEFAULT_THEMES: ThemeCatalog[] = [
  {
    id: "default-static",
    name: "تم پیش‌فرض",
    slug: "default",
    slug_display: "default",
    description: "تم پیش‌فرض و رایگان برای فروشگاه شما با طراحی ساده و حرفه‌ای.",
    thumbnail: null,
    thumbnail_url: null,
    gallery: [],
    gallery_expanded: [],
    tags: ["رایگان", "مینیمال", "فروشگاهی"],
    category: "فروشگاهی",
    is_paid: false,
    price: null,
    demo_url: null,
    is_active: true,
  },
];

function ensureUrl(url: string | null): string | null {
  if (!url) return null;
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
  if (url.startsWith("http")) return url;
  return `${base.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

export const themeApi = {
  async list(): Promise<ThemeCatalog[]> {
    try {
      const { data } = await apiClient.get<ThemeCatalog[] | { results: ThemeCatalog[] }>(
        "/page/themes/"
      );
      const list = Array.isArray(data) ? data : data?.results ?? [];
      if (list.length > 0) {
        return list.map((t) => ({
          ...t,
          thumbnail_url: ensureUrl(t.thumbnail_url) ?? t.thumbnail_url,
          gallery_expanded: (t.gallery_expanded ?? []).map((g) => ({
            ...g,
            url: ensureUrl(g.url) ?? g.url,
          })),
        }));
      }
      return DEFAULT_THEMES;
    } catch (err) {
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.warn("[themeApi] خطا در دریافت لیست تم‌ها از سرور:", err);
      }
      return DEFAULT_THEMES;
    }
  },
};
