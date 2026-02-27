import { apiClient } from "./apiClient";

export type StoreSettingItem = {
  definition: { key: string; type: string; default_value: string | null; description: string; can_edit_by_store: boolean };
  value: string;
  key?: string;
};

export function getStoreSetting(store: { settings?: StoreSettingItem[] } | null, key: string): string {
  if (!store?.settings) return "";
  const item = store.settings.find((s) => (s.definition?.key ?? s.key) === key);
  return (item?.value ?? "").trim();
}

export type StoreCategoryItem = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  index: number | null;
  capabilities: Record<string, boolean>;
};

export type StoreListItem = {
  id: string;
  title: string;
  en_title: string | null;
  name: string;
  store_category?: StoreCategoryItem | null;
  favicon: { id: string; file: string } | null;
  minimal_logo: { id: string; file: string } | null;
  full_logo: { id: string; file: string } | null;
  external_domain: string | null;
  internal_domain: string;
  is_shared_store?: boolean;
  description: string;
  slogan: string;
  theme_slug?: string;
  is_new: boolean;
  settings?: StoreSettingItem[];
  subscription_expires_at?: string | null;
  subscription_days_remaining?: number | null;
  subscription_plan?: { id: string; title: string; level: number } | null;
};

export type StoreDetail = StoreListItem & {
  settings?: StoreSettingItem[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

export function getMediaUrl(media: { file?: string } | null): string {
  if (!media?.file) return "";
  const file = media.file;
  if (file.startsWith("http")) return file;
  return `${API_BASE.replace(/\/$/, "")}${file.startsWith("/") ? "" : "/"}${file}`;
}

export type StoreWithRole = StoreListItem & { is_owner: boolean; is_admin: boolean };

export const storeApi = {
  async getMyStores(): Promise<StoreListItem[]> {
    const { data } = await apiClient.get<StoreListItem[]>(
      "/store/store/my_stores/"
    );
    return Array.isArray(data) ? data : [];
  },

  async getMyAccessibleStores(): Promise<StoreWithRole[]> {
    const { data } = await apiClient.get<StoreWithRole[]>(
      "/store/store/my_accessible_stores/"
    );
    return Array.isArray(data) ? data : [];
  },

  async getCurrentStore(): Promise<StoreDetail | null> {
    try {
      const { data } = await apiClient.get<StoreDetail>("/store/store/current/");
      return data ?? null;
    } catch {
      return null;
    }
  },

  async getStore(id: string): Promise<StoreDetail | null> {
    try {
      const { data } = await apiClient.get<StoreDetail>(`/store/store/${id}/`);
      return data ?? null;
    } catch {
      return null;
    }
  },

  async updateStore(id: string, payload: Partial<StoreListItem>): Promise<StoreDetail> {
    const { data } = await apiClient.patch<StoreDetail>(`/store/store/${id}/`, payload);
    return data;
  },

  async updateStoreSettings(id: string, settings: Record<string, string | number | boolean>): Promise<{ updated: string[] }> {
    const payload = Object.fromEntries(
      Object.entries(settings).map(([k, v]) => [k, String(v)])
    );
    const { data } = await apiClient.patch<{ updated: string[] }>(
      `/store/store/${id}/update-settings/`,
      payload
    );
    return data;
  },

  async getSetupProgress(): Promise<{
    tasks: Array<{ key: string; label: string; guide_path: string; optional: boolean; done: boolean }>;
    smart_setup_completed: boolean;
    smart_setup_pending: boolean;
    smart_setup_request_id?: string;
    smart_setup_current_stage?: string | null;
    store_id?: string;
    domain_change_pending?: boolean;
    domain_change_message?: string | null;
    domain_change_request_id?: string | null;
  }> {
    const { data } = await apiClient.get("/store/store/setup-progress/");
    return data;
  },

  async getInitialSetupService(): Promise<{
    slug: string;
    title: string;
    description: string;
    items: Array<{ key: string; title: string; description: string }>;
    cost_amount: number;
  }> {
    const { data } = await apiClient.get("/store/store/initial-setup-service/");
    return data;
  },

  async createDomainRequest(requestedDomain: string): Promise<{
    id: string;
    requested_domain: string;
    status: string;
    message: string;
  }> {
    const { data } = await apiClient.post<{
      id: string;
      requested_domain: string;
      status: string;
      message: string;
    }>("/store/store/create-domain-request/", { requested_domain: requestedDomain });
    return data;
  },

  async cancelDomainRequest(): Promise<void> {
    await apiClient.post("/store/store/cancel-domain-request/");
  },

  async getSmartSetupCost(): Promise<{ cost_amount: number }> {
    const { data } = await apiClient.get("/store/store/smart-setup-cost/");
    return data;
  },

  async createSmartSetupRequest(): Promise<{
    payment_link: string;
    smart_setup_request_id: string;
    cost_amount: number;
  }> {
    const { data } = await apiClient.post("/store/store/create-smart-setup-request/");
    return data;
  },
};
