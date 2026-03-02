import { apiClient } from "./apiClient";
import type { CustomerGroup } from "./customerGroupApi";

export type AdminPermissions = {
  products_read: boolean;
  products_write: boolean;
  products_delete: boolean;
  users_read: boolean;
  users_write: boolean;
  users_delete: boolean;
  orders_read: boolean;
  orders_write: boolean;
  orders_delete: boolean;
  blog_read: boolean;
  blog_write: boolean;
  blog_delete: boolean;
  reviews_read: boolean;
  reviews_write: boolean;
  reviews_delete: boolean;
  reservation_read: boolean;
  reservation_write: boolean;
  reservation_delete: boolean;
  media_delete: boolean;
};

export type StoreUser = {
  id: string;
  user: string;
  user_mobile: string | null;
  user_username: string;
  user_is_banned?: boolean;
  display_name: string | null;
  level: number;
  is_admin: boolean;
  is_admin_active: boolean;
  is_blocked: boolean;
  register_at: string;
  last_login: string | null;
  customer_groups?: CustomerGroup[];
  admin_permissions?: AdminPermissions | null;
};

export type StoreUserListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StoreUser[];
};

export type PlanInfo = {
  max_admins: number;
  active_admin_count: number;
  can_add_admin: boolean;
  is_owner: boolean;
};

export type MakeAdminRequest = {
  permissions: AdminPermissions;
};

const DEFAULT_PERMISSIONS: AdminPermissions = {
  products_read: false,
  products_write: false,
  products_delete: false,
  users_read: false,
  users_write: false,
  users_delete: false,
  orders_read: false,
  orders_write: false,
  orders_delete: false,
  blog_read: false,
  blog_write: false,
  blog_delete: false,
  reviews_read: false,
  reviews_write: false,
  reviews_delete: false,
  reservation_read: false,
  reservation_write: false,
  reservation_delete: false,
  media_delete: false,
};

export const storeUserApi = {
  async list(params?: {
    page?: number;
    page_size?: number;
  }): Promise<StoreUserListResponse> {
    const { data } = await apiClient.get<StoreUserListResponse>(
      "/account/store-users/",
      { params }
    );
    return data;
  },

  async get(id: string): Promise<StoreUser> {
    const { data } = await apiClient.get<StoreUser>(
      `/account/store-users/${id}/`
    );
    return data;
  },

  async block(id: string): Promise<{ detail: string }> {
    const { data } = await apiClient.post<{ detail: string }>(
      `/account/store-users/${id}/block/`
    );
    return data;
  },

  async unblock(id: string): Promise<{ detail: string }> {
    const { data } = await apiClient.post<{ detail: string }>(
      `/account/store-users/${id}/unblock/`
    );
    return data;
  },

  async makeAdmin(id: string, permissions: AdminPermissions): Promise<StoreUser> {
    const { data } = await apiClient.post<StoreUser>(
      `/account/store-users/${id}/make_admin/`,
      { permissions }
    );
    return data;
  },

  async removeAdmin(id: string): Promise<{ detail: string }> {
    const { data } = await apiClient.post<{ detail: string }>(
      `/account/store-users/${id}/remove_admin/`
    );
    return data;
  },

  async getPlanInfo(): Promise<PlanInfo> {
    const { data } = await apiClient.get<PlanInfo>(
      "/account/store-users/plan_info/"
    );
    return data;
  },

  async setGroups(id: string, groupIds: string[]): Promise<StoreUser> {
    const { data } = await apiClient.post<StoreUser>(
      `/account/store-users/${id}/set_groups/`,
      { group_ids: groupIds }
    );
    return data;
  },

  DEFAULT_PERMISSIONS,
};
