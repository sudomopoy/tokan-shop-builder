import axios from "axios";
import { readAuthHeaderValueFromStorage } from "@/lib/auth/storage";

function normalizeBaseUrl(url: string): string {
  // Remove trailing slash to keep URL joins predictable.
  return url.replace(/\/+$/, "");
}

const API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080",
);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
  timeout: 30_000,
});

// Add request interceptor to include auth token and X-Store-Host
apiClient.interceptors.request.use(
  (config) => {
    const authHeader = readAuthHeaderValueFromStorage();
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }
    // درخواست‌های CSR: دامنه‌ای که کاربر فرانت را با آن می‌بیند را به بک‌اند پاس می‌دهیم.
    // بدون این هدر، Origin/Host همیشه api.tokan.app می‌شود و فروشگاه اشتباه resolve می‌شود.
    if (typeof window !== "undefined" && window.location?.host) {
      config.headers["X-Store-Host"] = window.location.host;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
