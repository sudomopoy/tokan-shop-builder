import { apiClient } from "./apiClient";

export type Province = {
  id: string;
  name: string;
  slug: string;
  tel_prefix?: string | null;
};

export type City = {
  id: string;
  name: string;
  slug: string;
  province: string;
};

export type Address = {
  id: string;
  recipient_fullname: string;
  phone_number: string;
  address_line1: string;
  postcode?: string;
  province: string;
  city: string;
  frequently_used?: boolean;
};

export type CreateAddressRequest = {
  recipient_fullname: string;
  phone_number: string;
  address_line1: string;
  postcode?: string;
  province: string; // province id
  city: string; // city id
};

type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};

export const addressApi = {
  async list(): Promise<Address[]> {
    const { data } = await apiClient.get<Address[] | PaginatedResponse<Address>>("/account/address/");
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  },

  async create(payload: CreateAddressRequest): Promise<Address> {
    const { data } = await apiClient.post<Address>(
      "/account/address/",
      payload
    );
    return data;
  },
};
