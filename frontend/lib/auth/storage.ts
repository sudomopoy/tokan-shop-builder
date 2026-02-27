export type AuthMethod = "token" | "jwt";

export type AuthUser = {
  id?: string | number;
  name?: string;
  mobile?: string;
  avatarUrl?: string;
  [key: string]: unknown;
};

export type PersistedAuthV1 = {
  version: 1;
  method: AuthMethod;
  token?: string;
  access?: string;
  refresh?: string;
  user?: AuthUser;
  savedAt: number;
};

const STORAGE_KEY = "tokan_auth_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getAuthHeaderValue(auth: PersistedAuthV1 | null): string | null {
  if (!auth) return null;
  if (auth.method === "token" && auth.token) return `Token ${auth.token}`;
  if (auth.method === "jwt" && auth.access) return `Bearer ${auth.access}`;
  return null;
}

export function readPersistedAuth(): PersistedAuthV1 | null {
  if (!isBrowser()) return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeJsonParse<unknown>(raw) : null;

  if (
    parsed &&
    typeof parsed === "object" &&
    (parsed as any).version === 1 &&
    ((parsed as any).method === "token" || (parsed as any).method === "jwt")
  ) {
    return parsed as PersistedAuthV1;
  }

  // Backward compatibility: older keys used by existing widgets/api client.
  const legacyToken = localStorage.getItem("auth_token");
  if (legacyToken) {
    return {
      version: 1,
      method: "token",
      token: legacyToken,
      savedAt: Date.now(),
    };
  }

  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");
  if (access) {
    return {
      version: 1,
      method: "jwt",
      access,
      refresh: refresh ?? undefined,
      savedAt: Date.now(),
    };
  }

  return null;
}

export function writePersistedAuth(
  auth: Omit<PersistedAuthV1, "version" | "savedAt"> & { savedAt?: number }
): PersistedAuthV1 {
  const payload: PersistedAuthV1 = {
    version: 1,
    savedAt: auth.savedAt ?? Date.now(),
    method: auth.method,
    token: auth.token,
    access: auth.access,
    refresh: auth.refresh,
    user: auth.user,
  };

  if (!isBrowser()) return payload;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  syncLegacyAuthKeys(payload);
  return payload;
}

export function clearPersistedAuth(): void {
  if (!isBrowser()) return;

  localStorage.removeItem(STORAGE_KEY);
  // Legacy keys
  localStorage.removeItem("auth_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function syncLegacyAuthKeys(auth: PersistedAuthV1 | null): void {
  if (!isBrowser()) return;

  if (!auth) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return;
  }

  // Keep legacy keys in sync since other parts of the app may read them.
  if (auth.method === "token") {
    if (auth.token) {
      localStorage.setItem("auth_token", auth.token);
    } else {
      localStorage.removeItem("auth_token");
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  } else {
    localStorage.removeItem("auth_token");
    if (auth.access) localStorage.setItem("access_token", auth.access);
    else localStorage.removeItem("access_token");
    if (auth.refresh) localStorage.setItem("refresh_token", auth.refresh);
    else localStorage.removeItem("refresh_token");
  }
}

export function readAuthHeaderValueFromStorage(): string | null {
  const auth = readPersistedAuth();
  return getAuthHeaderValue(auth);
}

