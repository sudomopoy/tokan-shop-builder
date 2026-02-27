import axios from "axios";

import { apiClient } from "./apiClient";

export type MenuItemStatus = "active" | "inactive" | "coming_soon";
export type MenuItemType = "link" | "empty" | "category" | "product" | "page";

export type MenuItem = {
  id: string;
  title?: string | null;
  resolved_title?: string | null;
  item_type: MenuItemType;
  status: MenuItemStatus;
  url?: string | null;
  category?: string | null;
  product?: string | null;
  page?: string | null;
  category_name?: string | null;
  product_title?: string | null;
  page_path?: string | null;
  index: number;
  parent?: string | null;
  children?: MenuItem[];
};

export type Menu = {
  id: string;
  title: string;
  key?: string | null;
  description?: string | null;
  is_active: boolean;
  is_primary: boolean;
  items?: MenuItem[];
};

export type MenuListResponse = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: Menu[];
};

export type MenuCreateRequest = {
  title: string;
  key?: string | null;
  description?: string | null;
  is_active?: boolean;
  is_primary?: boolean;
};

export type MenuItemCreateRequest = {
  menu: string;
  parent?: string | null;
  title?: string | null;
  item_type: MenuItemType;
  status?: MenuItemStatus;
  url?: string | null;
  category?: string | null;
  product?: string | null;
  page?: string | null;
  index?: number;
};

export const menuApi = {
  async getByKey(key: string): Promise<Menu | null> {
    try {
      const { data } = await apiClient.get<Menu>("/menu/menus/by_key/", {
        params: { key },
      });
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  // Dashboard / management
  async list(params?: {
    page?: number;
    page_size?: number;
    key?: string;
    include_inactive?: boolean;
    [key: string]: unknown;
  }): Promise<MenuListResponse> {
    const { data } = await apiClient.get<Menu[] | MenuListResponse>("/menu/menus/", {
      params: { ...params, include_inactive: params?.include_inactive ? "1" : undefined },
    });
    if (Array.isArray(data)) {
      return { results: data };
    }
    return data as MenuListResponse;
  },

  async get(id: string): Promise<Menu> {
    const { data } = await apiClient.get<Menu>(`/menu/menus/${encodeURIComponent(id)}/`);
    return data;
  },

  async create(body: MenuCreateRequest): Promise<Menu> {
    const { data } = await apiClient.post<Menu>("/menu/menus/", body);
    return data;
  },

  async update(id: string, body: Partial<MenuCreateRequest>): Promise<Menu> {
    const { data } = await apiClient.patch<Menu>(`/menu/menus/${encodeURIComponent(id)}/`, body);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/menu/menus/${encodeURIComponent(id)}/`);
  },

  // Menu items
  async listItems(params: { menu: string; parent?: string | null }): Promise<MenuItem[]> {
    const { data } = await apiClient.get<MenuItem[] | { results: MenuItem[] }>(
      "/menu/menu-items/",
      { params }
    );
    return Array.isArray(data) ? data : (data?.results ?? []);
  },

  async getItemTree(menuId: string): Promise<MenuItem[]> {
    const { data } = await apiClient.get<MenuItem[]>("/menu/menu-items/tree/", {
      params: { menu: menuId },
    });
    return Array.isArray(data) ? data : [];
  },

  async createItem(body: MenuItemCreateRequest): Promise<MenuItem> {
    const { data } = await apiClient.post<MenuItem>("/menu/menu-items/", body);
    return data;
  },

  async updateItem(id: string, body: Partial<MenuItemCreateRequest>): Promise<MenuItem> {
    const { data } = await apiClient.patch<MenuItem>(
      `/menu/menu-items/${encodeURIComponent(id)}/`,
      body
    );
    return data;
  },

  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/menu/menu-items/${encodeURIComponent(id)}/`);
  },
};
