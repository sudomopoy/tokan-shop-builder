/**
 * Server-side API client for SSR.
 * Uses explicit headers (X-Store-Host) since window is unavailable on server.
 */
import axios from "axios";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080").replace(/\/+$/, "");

function createServerClient(hostHeader: string | null) {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (hostHeader) {
    headers["X-Store-Host"] = hostHeader;
  }

  const client = axios.create({
    baseURL: API_BASE,
    headers,
    timeout: 15_000,
  });
  return client;
}

export type { Product, ProductListResponse } from "./productApi";
export type { Category } from "./categoryApi";
export type { Article } from "./articleApi";
export type { Slider, Slide } from "./sliderApi";

export const createServerApi = (hostHeader: string | null) => {
  const client = createServerClient(hostHeader);

  return {
    async getPageByPath(path: string) {
      try {
        const { data } = await client.get("/page/pages/by-path/", { params: { path } });
        return data;
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
      }
    },

    async getProduct(id: string | number) {
      try {
        const { data } = await client.get(`/product/${encodeURIComponent(String(id))}/`);
        return data;
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
      }
    },

    async getProductList(params?: Record<string, unknown>) {
      const { data } = await client.get("/product/", { params });
      return data;
    },

    async getCategoryTree(module?: string) {
      const { data } = await client.get("/category/tree/", { params: { module } });
      return Array.isArray(data) ? data : [];
    },

    async getArticle(slug: string) {
      try {
        const { data } = await client.get(`/article/${encodeURIComponent(slug)}/`);
        return data;
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
      }
    },

    async getSlider(id: string) {
      try {
        const { data } = await client.get(`/slider/sliders/${id}/`);
        return data;
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
      }
    },
  };
};
