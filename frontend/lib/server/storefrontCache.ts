"use server";

import { revalidateTag } from "next/cache";

/**
 * Revalidate all storefront pages for a store.
 * Use when: store settings change, pages added/removed, path changed, setup-defaults.
 * @param storeDomain - Store's domain (e.g. mystore.tokan.app or internal_domain)
 */
export async function revalidateStorePages(storeDomain: string | null) {
  if (!storeDomain) return;
  revalidateTag(`store-pages:${storeDomain}`);
}

/**
 * Revalidate a single storefront page cache.
 * Use when: page content/widgets change (same path).
 * @param storeDomain - Store's domain
 * @param path - Page path (e.g. /, /about, /product/123/slug)
 */
export async function revalidatePage(storeDomain: string | null, path: string) {
  if (!storeDomain || !path) return;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  revalidateTag(`store-page:${storeDomain}:${normalizedPath}`);
}
