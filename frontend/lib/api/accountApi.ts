import { apiClient } from "./apiClient";

export type AdminPermissions = {
  products_read: boolean;
  products_write: boolean;
  products_delete: boolean;
  users_read: boolean;
  users_write: boolean;
  users_delete: boolean;
  orders_read: boolean;
  orders_write: boolean;
  orders_delete: boolean;
  blog_read: boolean;
  blog_write: boolean;
  blog_delete: boolean;
  media_delete: boolean;
};

export type User = {
  id: string;
  username: string;
  mobile: string;
  national_id?: string | null;
  is_verified: boolean;
  mobile_verified: boolean;
  is_superuser: boolean;
  last_login?: string | null;
  wallet?: {
    total_balance: string | number;
    gift_balance: string | number;
    blocked_balance: string | number;
    available_balance: string | number;
    withdrawable_balance: string | number;
  } | null;
  store_user?: {
    id: string;
    entry_source: string;
    email?: string | null;
    level: number;
    display_name?: string | null;
    register_at: string;
    last_login?: string | null;
    is_admin: boolean;
    is_admin_active: boolean;
    is_vendor: boolean;
    email_is_verified: boolean;
    admin_permissions?: AdminPermissions | null;
  } | null;
};

export type Address = {
  id: string;
  recipient_fullname: string;
  phone_number: string;
  address_line1: string;
  postcode?: string | null;
  province: {
    id: string;
    name: string;
  };
  city: {
    id: string;
    name: string;
  };
  frequently_used: boolean;
  created_at: string;
  updated_at: string;
};

export type BankAccount = {
  id: string;
  iban?: string;
  card_number?: string;
  status: string;
  created_at: string;
};

export type CreateAddressRequest = {
  recipient_fullname: string;
  phone_number: string;
  address_line1: string;
  postcode?: string;
  province: string; // Province ID
  city: string; // City ID
};

export type UpdateAddressRequest = Partial<CreateAddressRequest>;

export type CreateBankAccountRequest = {
  iban?: string;
  card_number?: string;
};

export const accountApi = {
  /**
   * Get current user information
   */
  async getInfo(): Promise<User> {
    const { data } = await apiClient.get<User>("/account/account/info/");
    return data;
  },

  /**
   * Get user addresses
   */
  async getAddresses(): Promise<Address[]> {
    const { data } = await apiClient.get<Address[] | { results: Address[] }>(
      "/account/address/"
    );
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  },

  /**
   * Get single address
   */
  async getAddress(id: string): Promise<Address> {
    const { data } = await apiClient.get<Address>(`/account/address/${id}/`);
    return data;
  },

  /**
   * Create new address
   */
  async createAddress(address: CreateAddressRequest): Promise<Address> {
    const { data } = await apiClient.post<Address>("/account/address/", address);
    return data;
  },

  /**
   * Update address
   */
  async updateAddress(id: string, address: UpdateAddressRequest): Promise<Address> {
    const { data } = await apiClient.patch<Address>(`/account/address/${id}/`, address);
    return data;
  },

  /**
   * Delete address
   */
  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`/account/address/${id}/`);
  },

  /**
   * Get user bank accounts
   */
  async getBankAccounts(): Promise<BankAccount[]> {
    const { data } = await apiClient.get<BankAccount[] | { results: BankAccount[] }>(
      "/account/bank-accounts/"
    );
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  },

  /**
   * Create bank account
   */
  async createBankAccount(account: CreateBankAccountRequest): Promise<BankAccount> {
    const { data } = await apiClient.post<BankAccount>("/account/bank-accounts/", account);
    return data;
  },

  /**
   * Delete bank account
   */
  async deleteBankAccount(id: string): Promise<void> {
    await apiClient.delete(`/account/bank-accounts/${id}/`);
  },

};