import { apiClient } from "./apiClient";

export type OrderItemInput = {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  custom_input_values?: Record<string, string>;
};

export type CreatePreOrderRequest = {
  items: OrderItemInput[];
  shipping_method?: string; // ShippingMethod id - optional for digital-only orders
  delivery_address?: string; // Address id - optional for digital-only orders
};

export type OrderItem = {
  id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price: string | number;
};

export type OrderAddress = {
  id: string;
  recipient_fullname: string;
  phone_number: string;
  address_line1: string;
  postcode?: string | null;
  province?: { id: string; name: string };
  city?: { id: string; name: string };
};

export type OrderStoreUser = {
  id: string;
  display_name: string;
  user_mobile: string;
};

export type Order = {
  id: string;
  code?: number;
  is_payed: boolean;
  products_total_amount: string | number;
  cart_discount_percent?: string | number;
  cart_discount_amount?: string | number;
  payable_amount: string | number;
  delivery_amount: string | number;
  status: string;
  shipping_tracking_code?: string | null;
  shipping_tracking_url?: string | null;
  shipping_method: string | { id: string; name: string };
  delivery_address: string | OrderAddress;
  store_user?: OrderStoreUser | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
};

export type ShippingMethodDefinition = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
};

export type SalesStatistics = {
  total_orders: number;
  total_revenue: string;
  today_revenue: string;
  month_revenue: string;
  paid_orders_count: number;
  pending_orders_count: number;
  cancelled_orders_count: number;
  delivered_orders_count: number;
  revenue_by_day: { date: string; revenue: string; orders_count: number }[];
  recent_orders: {
    id: string;
    code: number;
    payable_amount: string;
    status: string;
    created_at: string | null;
  }[];
};

export type ShippingMethod = {
  id: string;
  name: string;
  description?: string;
  definition?: ShippingMethodDefinition | null;
  is_active?: boolean;
  base_shipping_price: string | number;
  shipping_price_per_extra_kilograms?: string | number;
  tracking_code_base_url?: string | null;
  shipping_payment_on_delivery?: boolean;
  product_payment_on_delivery?: boolean;
  max_payment_on_delivery?: string | number | null;
};

export const orderApi = {
  async createPreOrder(payload: CreatePreOrderRequest): Promise<Order> {
    const { data } = await apiClient.post<Order>(
      "/order/orders/create_pre_order/",
      payload
    );
    return data;
  },

  async initOrderPayment(orderId: string, gatewayId: string): Promise<{ payment_link: string; authority: string; order_id: string }> {
    const { data } = await apiClient.post<{ payment_link: string; authority: string; order_id: string }>(
      "/order/orders/init_order_payment/",
      { order_id: orderId, gateway_id: gatewayId }
    );
    return data;
  },

  async listShippingMethods(forCheckout = false): Promise<ShippingMethod[]> {
    const url = forCheckout
      ? "/order/shipping-methods/?for_checkout=1"
      : "/order/shipping-methods/";
    const { data } = await apiClient.get<ShippingMethod[]>(url);
    return Array.isArray(data) ? data : [];
  },

  async createShippingMethod(payload: {
    name: string;
    description?: string;
    base_shipping_price: number;
    shipping_price_per_extra_kilograms?: number;
    tracking_code_base_url?: string | null;
    shipping_payment_on_delivery?: boolean;
    product_payment_on_delivery?: boolean;
    max_payment_on_delivery?: number | null;
    is_active?: boolean;
  }): Promise<ShippingMethod> {
    const { data } = await apiClient.post<ShippingMethod>(
      "/order/shipping-methods/",
      payload
    );
    return data;
  },

  async deleteShippingMethod(id: string): Promise<void> {
    await apiClient.delete(`/order/shipping-methods/${id}/`);
  },

  async updateShippingMethod(
    id: string,
    payload: Partial<{
      name: string;
      description: string;
      logo: string | null;
      shipping_payment_on_delivery: boolean;
      product_payment_on_delivery: boolean;
      max_payment_on_delivery: number | null;
      base_shipping_price: number;
      shipping_price_per_extra_kilograms: number;
      tracking_code_base_url: string | null;
      is_active: boolean;
    }>
  ): Promise<ShippingMethod> {
    const { data } = await apiClient.patch<ShippingMethod>(
      `/order/shipping-methods/${id}/`,
      payload
    );
    return data;
  },

  async getOrder(orderCode: string | number): Promise<Order> {
    const { data } = await apiClient.get<Order>(
      `/order/orders/${orderCode}/`
    );
    return data;
  },

  async getSalesStatistics(): Promise<SalesStatistics> {
    const { data } = await apiClient.get<SalesStatistics>(
      "/order/orders/sales_statistics/"
    );
    return data;
  },

  async listOrders(): Promise<Order[]> {
    const { data } = await apiClient.get<Order[] | { results: Order[] }>(
      "/order/orders/"
    );
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  },

  async getPurchasedDigitalContent(): Promise<{
    streaming: { id: string; order_item_id: string; title: string; stream_play_url: string; main_image?: { id: string; file: string } | null }[];
    download: {
      id: string;
      order_item_id: string;
      title: string;
      download_url?: string;
      files?: { title: string; description?: string; download_url: string }[];
      main_image?: { id: string; file: string } | null;
    }[];
  }> {
    const { data } = await apiClient.get<{ streaming: unknown[]; download: unknown[] }>(
      "/order/orders/purchased-digital-content/"
    );
    return {
      streaming: Array.isArray(data?.streaming) ? data.streaming : [],
      download: Array.isArray(data?.download) ? data.download : [],
    };
  },

  async cancelOrder(orderCode: string | number): Promise<{ status: string }> {
    const { data } = await apiClient.post<{ status: string }>(
      `/order/orders/${orderCode}/cancel_order/`
    );
    return data;
  },

  async updateOrder(
    orderCode: string | number,
    payload: { status?: string; shipping_tracking_code?: string }
  ): Promise<Order> {
    const { data } = await apiClient.patch<Order>(
      `/order/orders/${orderCode}/`,
      payload
    );
    return data;
  },
};
