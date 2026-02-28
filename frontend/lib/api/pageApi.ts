import axios from "axios";

import { PageConfig } from "@/themes/types";

import { apiClient } from "./apiClient";

export type PageListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PageConfig[];
};

export type PageUpsertRequest = {
  path: string;
  title?: string | null;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  is_active?: boolean;
  // allow store override if needed by backend
  store?: string | number;
};

export type WidgetTypeDto = {
  id: string | number;
  name: string;
  is_layout: boolean;
  description?: string | null;
  theme?: string | number | null;
  theme_name?: string;
  thumbnail?: unknown;
  icon?: string | null;
  visual_schema?: WidgetVisualSchema;
  default_payload?: WidgetDefaultPayload;
  style_presets?: WidgetStylePresetDto[];
  is_active: boolean;
};

export type WidgetStylePresetDto = {
  id?: string | number;
  key: string;
  name: string;
  description?: string | null;
  preview_image?: unknown;
  preview_url?: string | null;
  order?: number;
  is_active?: boolean;
  default_widget_config?: Record<string, unknown>;
  default_components_config?: Record<string, unknown>;
  default_extra_request_params?: Record<string, unknown>;
};

export type WidgetVisualField = {
  key: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "switch"
    | "select"
    | "entity_select"
    | "rich_text"
    | "form_fields";
  label: string;
  required?: boolean;
  source?: string;
  placeholder?: string;
  help_text?: string;
  default?: unknown;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
};

export type WidgetVisualGroup = {
  key: string;
  label: string;
  target: "widget_config" | "components_config" | "extra_request_params";
  fields: WidgetVisualField[];
};

export type WidgetVisualSchema = {
  version?: number;
  groups?: WidgetVisualGroup[];
};

export type WidgetDefaultPayload = {
  widget_config?: Record<string, unknown>;
  components_config?: Record<string, unknown>;
  extra_request_params?: Record<string, unknown>;
};

export type WidgetDto = {
  id: string | number;
  page: string | number;
  widget_type: string | number;
  widget_type_name?: string;
  index: number;
  is_active: boolean;
  components_config?: Record<string, unknown>;
  extra_request_params?: Record<string, unknown>;
  widget_config?: Record<string, unknown>;
};

export type WidgetListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: WidgetDto[];
};

function asPaginated<T>(
  data: unknown,
): { count: number; next: string | null; previous: string | null; results: T[] } {
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data as T[] };
  }
  if (data && typeof data === "object" && "results" in data && Array.isArray((data as any).results)) {
    const d = data as any;
    return {
      count: typeof d.count === "number" ? d.count : d.results.length,
      next: typeof d.next === "string" ? d.next : null,
      previous: typeof d.previous === "string" ? d.previous : null,
      results: d.results as T[],
    };
  }
  return { count: 0, next: null, previous: null, results: [] };
}

export type PageByPathResponse = PageConfig & { theme?: string };

export type WidgetBuilderOption = {
  value: string;
  label: string;
  [key: string]: unknown;
};

export type WidgetBuilderOptionsResponse = {
  sources: Record<string, WidgetBuilderOption[]>;
};

export const pageApi = {
  async getByPath(
    path: string,
    options?: { headers?: Record<string, string> }
  ): Promise<PageByPathResponse | null> {
    try {
      const { data } = await apiClient.get<PageByPathResponse>(
        "/page/pages/by-path/",
        {
          params: { path },
          headers: options?.headers,
        }
      );
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  // Dashboard / management helpers
  async list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    store?: string | number;
    [key: string]: unknown;
  }): Promise<PageListResponse> {
    const { data } = await apiClient.get<PageListResponse | PageConfig[]>("/page/pages/", {
      params,
    });
    return asPaginated<PageConfig>(data);
  },

  async get(id: string | number): Promise<PageConfig> {
    const { data } = await apiClient.get<PageConfig>(`/page/pages/${encodeURIComponent(String(id))}/`);
    return data;
  },

  async create(payload: PageUpsertRequest): Promise<PageConfig> {
    const { data } = await apiClient.post<PageConfig>("/page/pages/", payload);
    return data;
  },

  async update(id: string | number, payload: Partial<PageUpsertRequest>): Promise<PageConfig> {
    const { data } = await apiClient.patch<PageConfig>(
      `/page/pages/${encodeURIComponent(String(id))}/`,
      payload,
    );
    return data;
  },

  async delete(id: string | number): Promise<void> {
    await apiClient.delete(`/page/pages/${encodeURIComponent(String(id))}/`);
  },

  async listWidgetTypes(params?: { theme?: string | number; [key: string]: unknown }): Promise<WidgetTypeDto[]> {
    const { data } = await apiClient.get<WidgetTypeDto[] | { results: WidgetTypeDto[] }>(
      "/page/widget-types/",
      { params },
    );
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "results" in data && Array.isArray((data as any).results)) {
      return (data as any).results as WidgetTypeDto[];
    }
    return [];
  },

  async getBuilderOptions(params?: { sources?: string[]; store?: string | number }): Promise<WidgetBuilderOptionsResponse> {
    const query: Record<string, unknown> = {};
    if (params?.sources?.length) {
      query.sources = params.sources.join(",");
    }
    if (params?.store != null) {
      query.store = params.store;
    }
    const { data } = await apiClient.get<WidgetBuilderOptionsResponse>("/page/widget-types/builder-options/", {
      params: query,
    });
    return data && typeof data === "object" && "sources" in data
      ? data
      : { sources: {} };
  },

  async listWidgets(params?: { page_id?: string | number; page_size?: number; [key: string]: unknown }): Promise<WidgetListResponse> {
    const { data } = await apiClient.get<WidgetListResponse | WidgetDto[]>("/page/widgets/", { params });
    return asPaginated<WidgetDto>(data);
  },

  async createWidget(payload: Omit<WidgetDto, "id" | "widget_type_name">): Promise<WidgetDto> {
    const { data } = await apiClient.post<WidgetDto>("/page/widgets/", payload);
    return data;
  },

  async updateWidget(id: string | number, payload: Partial<Omit<WidgetDto, "id" | "widget_type_name">>): Promise<WidgetDto> {
    const { data } = await apiClient.patch<WidgetDto>(
      `/page/widgets/${encodeURIComponent(String(id))}/`,
      payload,
    );
    return data;
  },

  async deleteWidget(id: string | number): Promise<void> {
    await apiClient.delete(`/page/widgets/${encodeURIComponent(String(id))}/`);
  },

  /**
   * Setup default store pages with suggested widgets.
   * Calls backend endpoint which creates WidgetTypes if missing, then creates
   * essential pages: home, search, product detail, categories, basket, checkout,
   * login, profile, orders, order detail, blog, blog detail.
   */
  async setupDefaultStorePages(): Promise<{
    created: number;
    skipped: number;
    errors: string[];
    widget_types_created?: number;
  }> {
    try {
      const { data } = await apiClient.post<{
        created: number;
        skipped: number;
        errors: string[];
        widget_types_created?: number;
      }>("/page/pages/setup-defaults/", {});
      return {
        created: data.created ?? 0,
        skipped: data.skipped ?? 0,
        errors: data.errors ?? [],
        widget_types_created: data.widget_types_created,
      };
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        (Array.isArray(err?.response?.data) ? err.response.data.join(", ") : null) ??
        err?.message ??
        "خطا در راه‌اندازی صفحات پیش‌فرض";
      return { created: 0, skipped: 0, errors: [String(msg)] };
    }
  },
};
