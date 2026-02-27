import { apiClient } from "./apiClient";

export type VariantAttribute = {
  id: string;
  title: string;
  slug: string;
  display_type: "color" | "text" | "number";
  unit: string;
  is_system: boolean;
};

export type VariantAttributeValue = {
  id: string;
  title: string;
  code: string;
  sort_order: number;
  attribute: VariantAttribute;
  attribute_id?: string;
};

export type VariantSelection = {
  attribute_id: string;
  value_id: string;
};

export const variantApi = {
  async listAttributes(): Promise<VariantAttribute[]> {
    const { data } = await apiClient.get<VariantAttribute[] | { results: VariantAttribute[] }>(
      "/product/variant-attributes/"
    );
    return Array.isArray(data) ? data : (data?.results ?? []);
  },

  async createAttribute(payload: {
    title: string;
    slug?: string;
    display_type?: string;
    unit?: string;
  }): Promise<VariantAttribute> {
    const slug = payload.slug ?? payload.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { data } = await apiClient.post<VariantAttribute>("/product/variant-attributes/", {
      ...payload,
      slug,
    });
    return data;
  },

  async updateAttribute(id: string, payload: Partial<VariantAttribute>): Promise<VariantAttribute> {
    const { data } = await apiClient.patch<VariantAttribute>(
      `/product/variant-attributes/${id}/`,
      payload
    );
    return data;
  },

  async deleteAttribute(id: string): Promise<void> {
    await apiClient.delete(`/product/variant-attributes/${id}/`);
  },

  async getAttributeValues(attributeId: string): Promise<VariantAttributeValue[]> {
    const { data } = await apiClient.get<VariantAttributeValue[]>(
      `/product/variant-attributes/${attributeId}/values/`
    );
    return Array.isArray(data) ? data : [];
  },

  async addAttributeValue(
    attributeId: string,
    payload: { title: string; code?: string; sort_order?: number }
  ): Promise<VariantAttributeValue> {
    const { data } = await apiClient.post<VariantAttributeValue>(
      `/product/variant-attributes/${attributeId}/values/`,
      { ...payload, attribute_id: attributeId }
    );
    return data;
  },

  async updateAttributeValue(
    id: string,
    payload: Partial<{ title: string; code: string; sort_order: number }>
  ): Promise<VariantAttributeValue> {
    const { data } = await apiClient.patch<VariantAttributeValue>(
      `/product/variant-attribute-values/${id}/`,
      payload
    );
    return data;
  },

  async deleteAttributeValue(id: string): Promise<void> {
    await apiClient.delete(`/product/variant-attribute-values/${id}/`);
  },
};
