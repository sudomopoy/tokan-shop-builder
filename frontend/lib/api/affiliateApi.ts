import { apiClient } from "./apiClient";

export type AffiliateLink = {
  referral_code: string;
  referral_link: string;
};

export type AffiliateInvite = {
  id: string;
  created_at: string;
  invitee_mobile: string;
  invitee_username: string;
  commission_percent_display: string;
  expires_at_display: string | null;
  total_earnings: number;
  total_purchases: number;
  is_valid: boolean;
};

export type AffiliateEarning = {
  id: string;
  created_at: string;
  purchase_amount: number | string;
  commission_amount: number | string;
  commission_percent: number | string;
  status: string;
  order_code: number | null;
  invitee_mobile: string;
  description: string;
  completed_at: string | null;
};

export type AffiliateEarningsResponse = {
  earnings: AffiliateEarning[];
  total_completed: number;
  total_pending: number;
};

export type AffiliateConfig = {
  default_commission_percent: number;
  default_duration_months: number;
};

export const affiliateApi = {
  getMyLink(): Promise<AffiliateLink> {
    return apiClient.get("/affiliate/my_link/").then((r) => r.data);
  },
  getInvites(): Promise<AffiliateInvite[]> {
    return apiClient.get("/affiliate/invites/").then((r) => r.data);
  },
  getEarnings(): Promise<AffiliateEarningsResponse> {
    return apiClient.get("/affiliate/earnings/").then((r) => r.data);
  },
  getConfig(): Promise<AffiliateConfig> {
    return apiClient.get("/affiliate/config/").then((r) => r.data);
  },
};
