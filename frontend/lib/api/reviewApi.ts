import { apiClient } from "./apiClient";

export type ProductReview = {
  id: string;
  rating: number;
  body: string;
  display_name: string;
  created_at: string;
};

export type ProductReviewAdmin = ProductReview & {
  product: string;
  product_id: string;
  product_title: string;
  store_user: string;
  user_mobile: string;
  status: "pending" | "approved" | "rejected";
  approved_at: string | null;
  approved_by: string | null;
};

export type ReviewListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductReviewAdmin[];
};

export const reviewApi = {
  /** لیست نظرات تایید شده یک محصول (عمومی) */
  async listByProduct(productId: string): Promise<ProductReview[]> {
    const { data } = await apiClient.get<ProductReview[]>(
      `/product/${encodeURIComponent(productId)}/reviews/`
    );
    return Array.isArray(data) ? data : [];
  },

  /** ثبت نظر (کاربر لاگین‌شده) */
  async create(
    productId: string,
    payload: { rating: number; body?: string }
  ): Promise<ProductReviewAdmin> {
    const { data } = await apiClient.post<ProductReviewAdmin>(
      `/product/${encodeURIComponent(productId)}/reviews/`,
      payload
    );
    return data;
  },

  /** لیست نظرات برای داشبورد (با pagination) */
  async adminList(params?: {
    page?: number;
    page_size?: number;
    status?: "pending" | "approved" | "rejected";
    product?: string;
  }): Promise<ReviewListResponse> {
    const { data } = await apiClient.get<ReviewListResponse>("/review/", {
      params,
    });
    return data;
  },

  /** تایید نظر */
  async approve(reviewId: string): Promise<ProductReviewAdmin> {
    const { data } = await apiClient.post<ProductReviewAdmin>(
      `/review/${encodeURIComponent(reviewId)}/approve/`
    );
    return data;
  },

  /** رد نظر */
  async reject(reviewId: string): Promise<ProductReviewAdmin> {
    const { data } = await apiClient.post<ProductReviewAdmin>(
      `/review/${encodeURIComponent(reviewId)}/reject/`
    );
    return data;
  },
};
