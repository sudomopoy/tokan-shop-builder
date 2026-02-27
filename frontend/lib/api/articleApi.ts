import { apiClient } from "./apiClient";

export type ArticleMedia = {
  id: string;
  file: string;
};

export type ArticleCategory = {
  id: string;
  name: string;
  slug?: string;
  [key: string]: unknown;
};

export type Article = {
  id: string;
  module: string;
  title: string;
  slug: string;
  description: string;
  main_image: ArticleMedia | null;
  thumbnail_image: ArticleMedia | null;
  category: ArticleCategory | null;
  status: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  total_views?: number;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
};

export type ArticleListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Article[];
};

export type ArticleCreateUpdatePayload = {
  module: string;
  title: string;
  slug?: string;
  description?: string;
  status?: string;
  main_image?: string | null;
  thumbnail_image?: string | null;
  category?: string | null;
  tags?: string[];
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
};

export const articleApi = {
  async list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string[];
    categories?: string[];
    tags?: string[];
    created_at__gte?: string;
    created_at__lte?: string;
    module?: string;
    [key: string]: unknown;
  }): Promise<ArticleListResponse> {
    const { data } = await apiClient.get<ArticleListResponse>("/article/", {
      params,
    });
    return data;
  },

  async get(slug: string): Promise<Article> {
    const { data } = await apiClient.get<Article>(
      `/article/${encodeURIComponent(slug)}/`
    );
    return data;
  },

  async create(payload: ArticleCreateUpdatePayload): Promise<Article> {
    const body: Record<string, unknown> = {
      module: payload.module,
      title: payload.title,
      description: payload.description ?? "",
      status: payload.status ?? "draft",
    };
    if (payload.slug) body.slug = payload.slug;
    if (payload.main_image != null) body.main_image_id = payload.main_image;
    if (payload.thumbnail_image != null)
      body.thumbnail_image_id = payload.thumbnail_image;
    if (payload.category != null) body.category_id = payload.category;
    if (payload.tags?.length) body.tags = payload.tags;
    if (payload.meta_title != null) body.meta_title = payload.meta_title;
    if (payload.meta_description != null)
      body.meta_description = payload.meta_description;
    if (payload.canonical_url != null) body.canonical_url = payload.canonical_url;
    const { data } = await apiClient.post<Article>("/article/", body);
    return data;
  },

  async update(slug: string, payload: Partial<ArticleCreateUpdatePayload>): Promise<Article> {
    const body: Record<string, unknown> = {};
    if (payload.title != null) body.title = payload.title;
    if (payload.slug != null) body.slug = payload.slug;
    if (payload.description != null) body.description = payload.description;
    if (payload.status != null) body.status = payload.status;
    if (payload.main_image !== undefined) body.main_image_id = payload.main_image;
    if (payload.thumbnail_image !== undefined)
      body.thumbnail_image_id = payload.thumbnail_image;
    if (payload.category !== undefined) body.category_id = payload.category;
    if (payload.tags !== undefined) body.tags = payload.tags;
    if (payload.meta_title !== undefined) body.meta_title = payload.meta_title;
    if (payload.meta_description !== undefined)
      body.meta_description = payload.meta_description;
    if (payload.canonical_url !== undefined)
      body.canonical_url = payload.canonical_url;
    const { data } = await apiClient.patch<Article>(
      `/article/${encodeURIComponent(slug)}/`,
      body
    );
    return data;
  },

  async delete(slug: string): Promise<void> {
    await apiClient.delete(`/article/${encodeURIComponent(slug)}/`);
  },

  async search(
    query: string,
    params?: { page?: number; page_size?: number; module?: string }
  ): Promise<ArticleListResponse> {
    const { data } = await apiClient.get<ArticleListResponse>("/article/", {
      params: { search: query, module: params?.module ?? "blog", ...params },
    });
    return data;
  },
};
