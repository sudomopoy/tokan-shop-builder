import axios from "axios";

import { apiClient } from "./apiClient";
import type { Media, Store } from "./productApi";

export type Slide = {
  id: string;
  store?: Store;
  slider?: string;
  title: string | null;
  alt: string | null;
  description: string | null;
  url: string | null;
  button_text?: string | null;
  show_button?: boolean;
  index: number;
  is_active?: boolean;
  desktop_image: Media;
  mobile_image: Media | null;
  created_at: string;
  updated_at: string;
};

export type Slider = {
  id: string;
  store?: Store;
  title: string;
  is_active?: boolean;
  active_slides?: Slide[];
  slides?: Slide[];
  created_at: string;
  updated_at: string;
};

export type SliderListItem = {
  id: string;
  title: string;
  is_active: boolean;
  slides_count: number;
  created_at: string;
  updated_at: string;
};

export type SliderListResponse = {
  count?: number;
  results: SliderListItem[];
};

export type SliderCreateUpdatePayload = {
  title: string;
  is_active?: boolean;
};

export type SlideCreateUpdatePayload = {
  slider: string;
  title?: string | null;
  alt?: string | null;
  description?: string | null;
  url?: string | null;
  button_text?: string | null;
  show_button?: boolean;
  index?: number;
  is_active?: boolean;
  desktop_image: string;
  mobile_image?: string | null;
};

export const sliderApi = {
  async getById(id: string): Promise<Slider | null> {
    try {
      const { data } = await apiClient.get<Slider>(`/slider/sliders/${id}/`);
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  async list(params?: {
    include_inactive?: boolean;
    page_size?: number;
  }): Promise<SliderListResponse | SliderListItem[]> {
    const { data } = await apiClient.get<SliderListResponse | SliderListItem[]>(
      "/slider/sliders/",
      {
        params: {
          ...params,
          include_inactive: params?.include_inactive ? "1" : undefined,
        },
      }
    );
    if (Array.isArray(data)) {
      return { results: data };
    }
    return data as SliderListResponse;
  },

  async getForManagement(id: string): Promise<Slider & { slides: Slide[] }> {
    const { data } = await apiClient.get<Slider & { slides: Slide[] }>(
      `/slider/sliders/${id}/`,
      { params: { include_all_slides: "1" } }
    );
    return data;
  },

  async create(payload: SliderCreateUpdatePayload): Promise<Slider> {
    const { data } = await apiClient.post<Slider>("/slider/sliders/", payload);
    return data;
  },

  async update(
    id: string,
    payload: Partial<SliderCreateUpdatePayload>
  ): Promise<Slider> {
    const { data } = await apiClient.patch<Slider>(
      `/slider/sliders/${id}/`,
      payload
    );
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/slider/sliders/${id}/`);
  },

  async listSlides(sliderId: string): Promise<Slide[]> {
    const { data } = await apiClient.get<Slide[] | { results: Slide[] }>(
      "/slider/slides/",
      { params: { slider: sliderId } }
    );
    return Array.isArray(data) ? data : (data?.results ?? []);
  },

  async createSlide(payload: SlideCreateUpdatePayload): Promise<Slide> {
    const { data } = await apiClient.post<Slide>("/slider/slides/", payload);
    return data;
  },

  async updateSlide(
    id: string,
    payload: Partial<SlideCreateUpdatePayload>
  ): Promise<Slide> {
    const { data } = await apiClient.patch<Slide>(
      `/slider/slides/${id}/`,
      payload
    );
    return data;
  },

  async deleteSlide(id: string): Promise<void> {
    await apiClient.delete(`/slider/slides/${id}/`);
  },
};
