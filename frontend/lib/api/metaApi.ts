import { apiClient } from "./apiClient";

export type Province = {
  id: string;
  name: string;
  slug: string;
  tel_prefix?: string | null;
};

export type City = {
  id: string;
  name: string;
  slug: string;
  province: string;
};

export const metaApi = {
  async listProvinces(): Promise<Province[]> {
    const { data } = await apiClient.get<Province[]>("/meta/province/");
    return Array.isArray(data) ? data : [];
  },

  async listCities(provinceId?: string): Promise<City[]> {
    const params = provinceId ? { province: provinceId } : {};
    const { data } = await apiClient.get<City[]>("/meta/city/", { params });
    return Array.isArray(data) ? data : [];
  },
};
