import { DEPLOY_LOCALE } from "@/lib/i18n";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080").replace(/\/$/, "");

function getAuthHeader(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("tokan_auth_v1");
  if (!raw) return null;
  try {
    const auth = JSON.parse(raw);
    if (auth.method === "token" && auth.token) return `Token ${auth.token}`;
    if (auth.method === "jwt" && auth.access) return `Bearer ${auth.access}`;
  } catch {}
  return null;
}

export async function api<T>(
  path: string,
  options: RequestInit & { json?: object } = {}
): Promise<T> {
  const { json, ...init } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": DEPLOY_LOCALE,
    ...(init.headers as Record<string, string>),
  };
  if (json) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(json);
  }
  const auth = getAuthHeader();
  if (auth) headers["Authorization"] = auth;
  if (typeof window !== "undefined" && window.location?.host) {
    headers["X-Store-Host"] = window.location.host;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const err: any = new Error(res.statusText);
    err.status = res.status;
    try {
      err.data = await res.json();
    } catch {
      err.data = { detail: await res.text() };
    }
    throw err;
  }
  return res.json();
}

// درخواست پشتیبانی / مشاوره از لندینگ (بدون auth)
export async function submitSupportRequest(data: {
  name: string;
  phone: string;
  type?: string;
  message?: string;
  source?: string;
}) {
  return api<{ id: string; detail: string }>("/landing/support-request/", {
    method: "POST",
    json: {
      name: data.name.trim(),
      phone: data.phone.trim(),
      type: data.type ?? "",
      message: data.message?.trim() ?? "",
      source: data.source ?? "landing",
    },
  });
}

// Auth
export async function requestOTP(mobile: string, referralCode?: string) {
  const body: Record<string, string> = { mobile };
  if (referralCode) body.referral_code = referralCode;
  return api<{ detail: string }>("/auth/account/mobile/", {
    method: "POST",
    json: body,
  });
}

export async function verifyOTP(mobile: string, token: string) {
  return api<{ token: string }>("/auth/account/token/", {
    method: "POST",
    json: { mobile, token },
  });
}

// Store setup
export async function getStoreCategories() {
  return api<Array<{ id: string; title: string; description?: string }>>("/store/categories/");
}

export type ThemeCatalog = {
  id: string;
  name: string;
  slug: string | null;
  slug_display: string | null;
  description: string | null;
  thumbnail_url: string | null;
  gallery_expanded?: Array<{ url?: string | null; description?: string }>;
  tags?: string[];
  category?: string | null;
  is_paid?: boolean;
  price?: string | number | null;
  demo_url?: string | null;
};

function ensureThemeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const base = (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE : undefined) ?? "http://localhost:8080";
  return `${base.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function getThemes(freeOnly = false) {
  const params = freeOnly ? "?free_only=true" : "";
  const list = await api<ThemeCatalog[]>(`/page/themes/${params}`);
  return list.map((t) => ({
    ...t,
    thumbnail_url: ensureThemeUrl(t.thumbnail_url) ?? t.thumbnail_url,
    gallery_expanded: (t.gallery_expanded ?? []).map((g) => ({
      ...g,
      url: ensureThemeUrl(g.url) ?? g.url,
    })),
  }));
}

export async function checkStoreName(storeName: string) {
  return api<{ status: string; detail: string }>("/store/store/check_store_name/", {
    method: "POST",
    json: { store_name: storeName },
  });
}

export async function createStore(payload: {
  title: string;
  name: string;
  description?: string;
  slogan?: string;
  store_category?: string;
  theme_slug?: string;
}) {
  return api<{
    id: string;
    name: string;
    internal_domain: string;
    title: string;
  }>("/store/store/", {
    method: "POST",
    json: payload,
  });
}

// پنل مدیریت - API برای داشبورد کاربر
export async function getPanelInfo() {
  return api<{
    user: { username?: string; mobile?: string; is_superuser?: boolean; wallet?: { available_balance?: number | string; withdrawable_balance?: number | string } };
    affiliate_link: { referral_code: string; referral_link: string };
    stores: Array<{
      id: string;
      name: string;
      title: string;
      internal_domain: string;
      external_domain?: string;
      dashboard_url?: string;
      is_owner: boolean;
    }>;
  }>("/account/panel-info/");
}

export async function getAffiliateInvites() {
  return api<Array<{
    id: string;
    created_at: string;
    invitee_mobile: string;
    invitee_username?: string;
    commission_percent_display: string;
    total_earnings: number;
    total_purchases: number;
    is_valid: boolean;
  }>>("/affiliate/invites/");
}

export async function getAffiliateEarnings() {
  return api<{
    earnings: Array<{
      id: string;
      created_at: string;
      purchase_amount: number;
      commission_amount: number;
      description?: string;
      order_code?: number;
      status: string;
    }>;
    total_completed: number;
    total_pending: number;
  }>("/affiliate/earnings/");
}

export async function getWalletTransactions() {
  const data = await api<unknown>("/wallet/transactions/");
  const list = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? [];
  return list as Array<{ id: string; payment_method: string; withdrawable_amount: number; timestamp: string; status: string }>;
}

export async function getWalletChargeGateways() {
  const data = await api<unknown>("/wallet/charge_gateways/");
  return (Array.isArray(data) ? data : []) as Array<{ id: string; title: string }>;
}

export async function chargeWallet(amount: number, gatewayId: string) {
  return api<{ status: string; payment_link: string }>("/wallet/charge_request_wallet/", {
    method: "POST",
    json: { amount, gateway_id: gatewayId },
  });
}

// درخواست برداشت از کیف پول
export type WithdrawRequestItem = {
  id: string;
  amount: string | number;
  status: "pending" | "approved" | "rejected" | "deposited";
  bank_sheba_or_card: string;
  bank_name: string;
  account_holder: string;
  description?: string;
  rejection_reason?: string;
  deposit_reference_id?: string;
  created_at: string;
  updated_at: string;
  user_mobile?: string;
  user_username?: string;
};

export async function getWithdrawRequests() {
  return api<WithdrawRequestItem[]>("/wallet/withdraw-requests/");
}

export async function getWithdrawRequestDetail(id: string) {
  return api<WithdrawRequestItem>(`/wallet/withdraw-requests/${id}/`);
}

export async function createWithdrawRequest(data: {
  amount: number;
  bank_sheba_or_card: string;
  bank_name: string;
  account_holder: string;
  description?: string;
}) {
  return api<WithdrawRequestItem>("/wallet/withdraw-requests/", {
    method: "POST",
    json: data,
  });
}

export async function approveWithdrawRequest(id: string) {
  return api<WithdrawRequestItem>(`/wallet/withdraw-requests/${id}/approve/`, {
    method: "POST",
  });
}

export async function rejectWithdrawRequest(id: string, rejection_reason: string) {
  return api<WithdrawRequestItem>(`/wallet/withdraw-requests/${id}/reject/`, {
    method: "POST",
    json: { rejection_reason },
  });
}

export async function markWithdrawDeposited(id: string, deposit_reference_id: string) {
  return api<WithdrawRequestItem>(`/wallet/withdraw-requests/${id}/mark_deposited/`, {
    method: "POST",
    json: { deposit_reference_id },
  });
}

// Blog (مقالات بلاگ super store - توکان)
export type ArticleMedia = { id: string; file: string };
export type ArticleCategory = { id: string; name: string; slug?: string };
export type Article = {
  id: string;
  module: string;
  title: string;
  slug: string;
  description: string;
  main_image: ArticleMedia | null;
  thumbnail_image: ArticleMedia | null;
  category: ArticleCategory | null;
  status: string;
  created_at: string;
  updated_at: string;
  tags: unknown[];
  total_views?: number;
  meta_title?: string | null;
  meta_description?: string | null;
};

export type ArticleListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Article[];
};

export async function getArticles(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  categories?: string[];
  module?: string;
}): Promise<ArticleListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.page_size) searchParams.set("page_size", String(params.page_size));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.categories?.length) params.categories.forEach((c) => searchParams.append("categories", c));
  if (params?.module) searchParams.set("module", params.module);
  const qs = searchParams.toString();
  return api<ArticleListResponse>(`/article/${qs ? `?${qs}` : ""}`);
}

export async function getArticle(slug: string): Promise<Article> {
  return api<Article>(`/article/${encodeURIComponent(slug)}/`);
}

export function resolveArticleImageUrl(article: Article, preferMain = false): string {
  const file = preferMain
    ? article.main_image?.file || article.thumbnail_image?.file
    : article.thumbnail_image?.file || article.main_image?.file;
  if (!file) return "https://via.placeholder.com/800x450?text=توکان";
  if (file.startsWith("http")) return file;
  const base = (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE : undefined) ?? "http://localhost:8080";
  return `${base.replace(/\/$/, "")}${file.startsWith("/") ? "" : "/"}${file}`;
}
