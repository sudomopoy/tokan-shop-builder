import { apiClient } from "./apiClient";
import type { Media } from "./productApi";

export type MediaListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Media[];
};

export const mediaApi = {
  async list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<MediaListResponse> {
    const { data } = await apiClient.get<MediaListResponse>("/media/", {
      params,
    });
    return data;
  },

  async get(id: string): Promise<Media> {
    const { data } = await apiClient.get<Media>(`/media/${id}/`);
    return data;
  },

  async upload(file: File): Promise<Media> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<Media>("/media/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  async update(
    id: string,
    payload: { title?: string; description?: string }
  ): Promise<Media> {
    const { data } = await apiClient.patch<Media>(`/media/${id}/`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/media/${id}/`);
  },
};
