import { apiClient } from "./apiClient";
import type { CustomerGroupLite } from "./productApi";

export type CustomerGroup = CustomerGroupLite & {
  description: string;
  is_default: boolean;
  is_active: boolean;
};

type CustomerGroupListResponse = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: CustomerGroup[];
};

export const customerGroupApi = {
  async list(): Promise<CustomerGroup[]> {
    const { data } = await apiClient.get<CustomerGroup[] | CustomerGroupListResponse>(
      "/account/customer-groups/"
    );
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  },

  async create(payload: {
    name: string;
    slug?: string;
    description?: string;
    is_default?: boolean;
    is_active?: boolean;
  }): Promise<CustomerGroup> {
    const { data } = await apiClient.post<CustomerGroup>("/account/customer-groups/", payload);
    return data;
  },

  async update(
    id: string,
    payload: Partial<{
      name: string;
      slug: string;
      description: string;
      is_default: boolean;
      is_active: boolean;
    }>
  ): Promise<CustomerGroup> {
    const { data } = await apiClient.patch<CustomerGroup>(
      `/account/customer-groups/${id}/`,
      payload
    );
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/account/customer-groups/${id}/`);
  },
};

