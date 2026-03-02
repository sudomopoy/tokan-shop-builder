import axios from "axios";
import { apiClient } from "./apiClient";
import { Product, Variant } from "./productApi";

export type BasketItem = {
  id: string;
  product: string; // product id
  variant: string | null; // variant id
  quantity: number;
  product_details: Product;
  variant_details: Variant | null;
  unit_price: string | number;
  line_subtotal: string | number;
  line_discount_amount: string | number;
  quantity_discount_percent: string | number;
  applied_group_price_id: string | null;
  total_price: string | number;
};

export type Basket = {
  id: string;
  store: string;
  store_user: string;
  items: BasketItem[];
  subtotal: string | number;
  cart_discount_percent: string | number;
  cart_discount_amount: string | number;
  total_price: string | number;
  total_items: number;
  created_at: string;
  updated_at: string;
};

export const basketApi = {
  async get(): Promise<Basket | null> {
    try {
      // لیست برمی‌گرداند اما چون همیشه یک سبد فعال داریم، ما اولین آیتم آرایه یا خود آبجکت را نیاز داریم
      // با توجه به پیاده‌سازی ViewSet که در list یک آبجکت برمی‌گرداند (override شده)، مستقیم دیتا را می‌گیریم.
      const { data } = await apiClient.get<Basket>("/basket/baskets/");
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  async addItem(productId: string, variantId: string | null, quantity: number): Promise<Basket> {
    const { data } = await apiClient.post<Basket>("/basket/baskets/add/", {
      product: productId,
      variant: variantId,
      quantity,
    });
    return data;
  },

  async removeItem(itemId: string): Promise<Basket> {
    const { data } = await apiClient.post<Basket>("/basket/baskets/remove/", {
      item_id: itemId,
    });
    return data;
  },

  async updateItem(itemId: string, quantity: number): Promise<Basket> {
    const { data } = await apiClient.post<Basket>("/basket/baskets/update/", {
      item_id: itemId,
      quantity,
    });
    return data;
  },
};
