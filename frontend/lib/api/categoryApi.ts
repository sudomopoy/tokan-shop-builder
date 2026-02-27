import { apiClient } from "./apiClient";

export type CategoryIcon = {
  id: string;
  file?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string | null;
  module: string;
  parent: string | null;
  icon: CategoryIcon | null;
  icon_type?: string;
  default_icon?: string | null;
  icon_color?: string | null;
  icon_url?: string | null;
  icon_svg?: string | null;
  children?: Category[];
  children_count?: number;
  is_editable?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CategoryIconChoice = { value: string; label: string };

export type CategoryListResponse = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: Category[];
};

export const categoryApi = {
  async list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    module?: string;
    parent?: string | null;
    parent__isnull?: boolean;
    [key: string]: unknown;
  }): Promise<CategoryListResponse> {
    const { data } = await apiClient.get<Category[] | CategoryListResponse>("/category/", {
      params,
    });
    if (Array.isArray(data)) {
      return { results: data };
    }
    return data as CategoryListResponse;
  },

  async iconChoices(): Promise<CategoryIconChoice[]> {
    const { data } = await apiClient.get<CategoryIconChoice[]>("/category/icons/");
    return Array.isArray(data) ? data : [];
  },

  async tree(params?: { module?: string }): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>("/category/tree/", {
      params,
    });
    return Array.isArray(data) ? data : [];
  },

  async get(id: string): Promise<Category> {
    const { data } = await apiClient.get<Category>(`/category/${id}/`);
    return data;
  },

  async search(
    query: string,
    params?: { module?: string; parent?: string | null; parent__isnull?: boolean }
  ): Promise<Category[]> {
    const res = await this.list({
      search: query,
      module: params?.module ?? "STORE",
      page_size: 50,
      ...params,
    });
    return res.results ?? [];
  },

  async create(body: {
    name: string;
    module?: string;
    parent_id?: string | null;
    icon_id?: string | null;
    icon_type?: string;
    default_icon?: string | null;
    icon_color?: string | null;
  }): Promise<Category> {
    const { data } = await apiClient.post<Category>("/category/", {
      name: body.name,
      module: body.module ?? "STORE",
      ...(body.parent_id != null && { parent_id: body.parent_id }),
      ...(body.icon_id != null && { icon_id: body.icon_id }),
      ...(body.icon_type != null && { icon_type: body.icon_type }),
      ...(body.default_icon != null && { default_icon: body.default_icon }),
      ...(body.icon_color != null && { icon_color: body.icon_color }),
    });
    return data;
  },

  async update(
    id: string,
    body: {
      name?: string;
      parent_id?: string | null;
      icon_id?: string | null;
      icon_type?: string;
      default_icon?: string | null;
      icon_color?: string | null;
    }
  ): Promise<Category> {
    const { data } = await apiClient.patch<Category>(`/category/${id}/`, body);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/category/${id}/`);
  },
};
