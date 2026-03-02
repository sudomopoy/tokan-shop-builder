import { apiClient } from "./apiClient";

export type Media = {
  id: string;
  title: string;
  description: string;
  file: string;
  file_type: string;
  file_size: number;
  hash_sum: string;
  uploaded_at: string;
  original_filename: string;
  domain: string;
  created_at: string;
  updated_at: string;
};

export type Store = {
  id: string;
  title: string;
  en_title: string | null;
  name: string;
  favicon: string | null;
  minimal_logo: string | null;
  full_logo: string | null;
  external_domain: string | null;
  internal_domain: string;
  description: string;
  slogan: string;
  is_new: boolean;
};

export type Category = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  parent: string | null;
  created_at: string;
  updated_at: string;
};

export type Variant = {
  id: string;
  price: string;
  sell_price: string;
  cooperate_price: string | null;
  main_image: Media | null;
  list_images: Media[];
  stock: number;
  stock_unlimited?: boolean;
  attribute_values: unknown[];
};

export type CustomerGroupLite = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
};

export type ProductGroupPrice = {
  id: string;
  customer_group?: CustomerGroupLite;
  customer_group_id?: string;
  variant?: string | null;
  variant_id?: string | null;
  price: string | null;
  sell_price: string;
  is_active: boolean;
};

export type ProductTierDiscount = {
  id: string;
  customer_group?: CustomerGroupLite | null;
  customer_group_id?: string | null;
  min_quantity: number;
  max_quantity: number | null;
  discount_percent: string;
  is_active: boolean;
};

export type StoreCartTierDiscount = {
  id: string;
  criterion: "amount" | "items_count";
  min_value: string;
  max_value: string | null;
  discount_percent: string;
  customer_group?: CustomerGroupLite | null;
  customer_group_id?: string | null;
  is_active: boolean;
};

export type InventoryAdjustmentMode = "set" | "increase" | "decrease";

export type ProductInventoryAdjustPayload = {
  mode: InventoryAdjustmentMode;
  quantity: number;
  note?: string;
  variant_id?: string | null;
};

export type ProductInventoryAdjustResponse = {
  product_id: string;
  variant_id: string | null;
  quantity_before: number;
  quantity_after: number;
  log_id: string;
};

export type InventoryAdjustmentLog = {
  id: string;
  product: string;
  variant: string | null;
  reason: string;
  quantity_before: number;
  quantity_after: number;
  quantity_change: number;
  note: string;
  actor_store_user: string | null;
  actor_user: string | null;
  actor_mobile: string;
  order: string | null;
  created_at: string;
};

export type CustomInputDefinition = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
};

export type DownloadableFileEntry = {
  media_id: string;
  title?: string;
  description?: string;
};

export type Product = {
  id: string;
  store: Store;
  average_rating?: number | null;
  reviews_count?: number;
  is_active?: boolean;
  title: string;
  short_description: string;
  description: string;
  product_type?: "physical" | "digital";
  digital_subtype?: string | null;
  downloadable_file?: Media | null;
  downloadable_files?: DownloadableFileEntry[];
  custom_input_definitions?: CustomInputDefinition[];
  code: number;
  stock: number;
  stock_unlimited?: boolean;
  soled: number;
  categories?: Category[];
  tags?: { id: string; name: string }[];
  price: string;
  sell_price: string;
  cooperate_price: string | null;
  allowed_customer_groups?: CustomerGroupLite[];
  is_wholesale_mode?: boolean;
  min_order_quantity?: number | null;
  max_order_quantity?: number | null;
  pack_size?: number;
  min_pack_count?: number;
  group_prices?: ProductGroupPrice[];
  quantity_discounts?: ProductTierDiscount[];
  variants: Variant[];
  main_image: Media | null;
  list_images: Media[];
  main_variant: Variant | null;
  information: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ProductListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
};

export const productApi = {
  async get(idOrCode: string | number): Promise<Product> {
    const { data } = await apiClient.get<Product>(`/product/${encodeURIComponent(String(idOrCode))}/`);
    return data;
  },

  async list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    categories?: string[];
    [key: string]: unknown;
  }): Promise<ProductListResponse> {
    const { data } = await apiClient.get<ProductListResponse>("/product/", {
      params,
    });
    return data;
  },

  async create(product: Partial<Product>): Promise<Product> {
    const { data } = await apiClient.post<Product>("/product/", product);
    return data;
  },

  async update(id: string | number, product: Partial<Product>): Promise<Product> {
    const { data } = await apiClient.patch<Product>(`/product/${id}/`, product);
    return data;
  },

  async delete(id: string | number): Promise<void> {
    await apiClient.delete(`/product/${id}/`);
  },

  async bulkAction(
    ids: string[],
    action: "activate" | "deactivate" | "delete"
  ): Promise<{ updated?: number; deleted?: number; message: string }> {
    const { data } = await apiClient.post<{ updated?: number; deleted?: number; message: string }>(
      "/product/bulk-action/",
      { ids, action }
    );
    return data;
  },

  async listCartTierDiscounts(): Promise<StoreCartTierDiscount[]> {
    const { data } = await apiClient.get<StoreCartTierDiscount[]>("/product/cart-tier-discounts/");
    return Array.isArray(data) ? data : [];
  },

  async createCartTierDiscount(
    payload: Partial<{
      criterion: "amount" | "items_count";
      min_value: string | number;
      max_value: string | number | null;
      discount_percent: string | number;
      customer_group_id: string | null;
      is_active: boolean;
    }>
  ): Promise<StoreCartTierDiscount> {
    const { data } = await apiClient.post<StoreCartTierDiscount>(
      "/product/cart-tier-discounts/",
      payload
    );
    return data;
  },

  async updateCartTierDiscount(
    id: string,
    payload: Partial<{
      criterion: "amount" | "items_count";
      min_value: string | number;
      max_value: string | number | null;
      discount_percent: string | number;
      customer_group_id: string | null;
      is_active: boolean;
    }>
  ): Promise<StoreCartTierDiscount> {
    const { data } = await apiClient.patch<StoreCartTierDiscount>(
      `/product/cart-tier-discounts/${id}/`,
      payload
    );
    return data;
  },

  async deleteCartTierDiscount(id: string): Promise<void> {
    await apiClient.delete(`/product/cart-tier-discounts/${id}/`);
  },

  async getInventoryLogs(productId: string): Promise<InventoryAdjustmentLog[]> {
    const { data } = await apiClient.get<InventoryAdjustmentLog[]>(
      `/product/${productId}/inventory-logs/`
    );
    return Array.isArray(data) ? data : [];
  },

  async adjustInventory(
    productId: string,
    payload: ProductInventoryAdjustPayload
  ): Promise<ProductInventoryAdjustResponse> {
    const { data } = await apiClient.post<ProductInventoryAdjustResponse>(
      `/product/${productId}/adjust-inventory/`,
      payload
    );
    return data;
  },
};
