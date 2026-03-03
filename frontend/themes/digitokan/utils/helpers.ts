/**
 * Helper functions for Digitokan theme
 */

/**
 * Format price in Persian format with thousand separators
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fa-IR").format(price);
}

/**
 * Create URL-friendly slug from text
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "product";
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(originalPrice: number, sellPrice: number): number {
  if (originalPrice <= sellPrice) return 0;
  return Math.round(((originalPrice - sellPrice) / originalPrice) * 100);
}

/**
 * Get full image URL
 */
export function imageUrl(file: string | undefined): string {
  if (!file) return "";
  return file.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_BASE || ""}${file}` : file;
}
