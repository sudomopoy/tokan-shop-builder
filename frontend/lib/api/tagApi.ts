import { apiClient } from "./apiClient";

export type Tag = {
  id: string;
  name: string;
};

export const tagApi = {
  async list(params?: { nocache?: boolean }): Promise<Tag[]> {
    const { data } = await apiClient.get<Tag[] | { results: Tag[] }>("/tag/", {
      params: params?.nocache ? { _t: Date.now() } : undefined,
    });
    return Array.isArray(data) ? data : (data?.results ?? []);
  },

  async create(body: { name: string }): Promise<Tag> {
    const { data } = await apiClient.post<Tag>("/tag/", body);
    return data;
  },

  async update(id: string, body: { name: string }): Promise<Tag> {
    const { data } = await apiClient.patch<Tag>(`/tag/${id}/`, body);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tag/${id}/`);
  },
};
