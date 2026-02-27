import { apiClient } from "./apiClient";

export type PaymentGatewayConfigField = {
  key: string;
  label: string;
  type: "text" | "password" | "number";
  required?: boolean;
};

export type PaymentGatewayType = {
  id: string;
  name: string;
  title: string;
  has_sandbox?: boolean;
  config_schema?: PaymentGatewayConfigField[];
};

export type PaymentGateway = {
  id: string;
  title: string;
  gateway_type: PaymentGatewayType;
  logo?: string | null;
  configuration?: Record<string, string | number>;
  is_sandbox?: boolean;
};

export type PaymentGatewayUpdatePayload = {
  title?: string;
  logo?: string | null;
  configuration?: Record<string, string | number>;
  is_sandbox?: boolean;
};

export const paymentApi = {
  async listGateways(): Promise<PaymentGateway[]> {
    const { data } = await apiClient.get<PaymentGateway[] | { results: PaymentGateway[] }>(
      "/payment/gateways/"
    );
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  },

  async updateGateway(id: string, payload: PaymentGatewayUpdatePayload): Promise<PaymentGateway> {
    const { data } = await apiClient.patch<PaymentGateway>(`/payment/gateways/${id}/`, payload);
    return data;
  },
};
