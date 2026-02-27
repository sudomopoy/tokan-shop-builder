import { apiClient } from "./apiClient";

export type SubscriptionPlanDuration = {
  id: string;
  duration_months: number;
  base_price: string;
  discount_percent: string;
  final_price: number;
  is_active: boolean;
};

export type SubscriptionPlan = {
  id: string;
  title: string;
  description: string;
  level: number;
  is_active: boolean;
  is_default: boolean;
  durations: SubscriptionPlanDuration[];
};

export type SubscriptionStatus = {
  subscription_expires_at: string | null;
  subscription_days_remaining: number | null;
  subscription_plan: { id: string; title: string; level: number } | null;
  is_expired: boolean;
  is_expired_over_10_days: boolean;
};

export type RenewResponse = {
  payment_link: string | null;
  subscription_payment_id: string;
  completed?: boolean;
};

export type SubscriptionPaymentHistoryItem = {
  id: string;
  created_at: string;
  plan: string;
  plan_title: string;
  duration_months: number;
  amount: string | number;
  status: string;
};

export const subscriptionApi = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data } = await apiClient.get<SubscriptionPlan[] | { results: SubscriptionPlan[] }>(
      "/subscription/plans/"
    );
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  },

  async getStatus(): Promise<SubscriptionStatus> {
    const { data } = await apiClient.get<SubscriptionStatus>(
      "/subscription/status/"
    );
    return data;
  },

  async renew(payload: {
    plan_id: string;
    duration_months: number;
    discount_code?: string;
    wallet_amount?: number;
  }): Promise<RenewResponse> {
    const { data } = await apiClient.post<RenewResponse>(
      "/subscription/renew/",
      payload
    );
    return data;
  },

  async getHistory(): Promise<SubscriptionPaymentHistoryItem[]> {
    const { data } = await apiClient.get<SubscriptionPaymentHistoryItem[]>(
      "/subscription/history/"
    );
    return Array.isArray(data) ? data : [];
  },

  async verifyDiscount(payload: {
    code: string;
    plan_id?: string;
    duration_months?: number;
  }): Promise<{
    valid: boolean;
    detail?: string;
    discount_type?: string;
    discount_value?: number;
  }> {
    const { data } = await apiClient.post(
      "/subscription/verify-discount/",
      payload
    );
    return data;
  },
};
