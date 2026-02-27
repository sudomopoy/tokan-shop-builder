import { apiClient } from "./apiClient";

export type WalletBalance = {
  total_balance: string | number;
  gift_balance: string | number;
  blocked_balance: string | number;
  available_balance: string | number;
  withdrawable_balance: string | number;
};

export type TransactionItem = {
  id: string;
  withdrawable_amount: string | number;
  gift_amount?: string | number;
  payment_method: string;
  timestamp: string;
  status: string;
  is_payed: boolean;
};

export type ChargeRequestResult = {
  status: string;
  payment_link: string;
};

export type PaymentGateway = {
  id: string;
  title: string;
  gateway_type: { id: string; name: string; title: string };
  logo?: string | null;
  is_sandbox?: boolean;
};

export const walletApi = {
  async getChargeGateways(): Promise<PaymentGateway[]> {
    const { data } = await apiClient.get<PaymentGateway[]>(
      "/wallet/charge_gateways/"
    );
    return Array.isArray(data) ? data : [];
  },

  async getWallets(): Promise<WalletBalance[]> {
    const { data } = await apiClient.get<WalletBalance[] | { results: WalletBalance[] }>(
      "/wallet/"
    );
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  },

  async chargeWallet(amount: number, gatewayId: string, orderId?: string): Promise<ChargeRequestResult> {
    const { data } = await apiClient.post<ChargeRequestResult>(
      "/wallet/charge_request_wallet/",
      { amount, gateway_id: gatewayId, order_id: orderId }
    );
    return data;
  },

  async getTransactions(): Promise<TransactionItem[]> {
    try {
      const { data } = await apiClient.get<TransactionItem[] | { results: TransactionItem[] }>(
        "/wallet/transactions/"
      );
      if (Array.isArray(data)) return data;
      if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
        return data.results;
      }
      return [];
    } catch {
      return [];
    }
  },
};
