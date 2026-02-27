"use client";

import React, { PropsWithChildren, useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/lib/store/store";
import { useAppDispatch } from "@/lib/store/hooks";
import { hydrateAuthFromStorage } from "@/lib/auth/authService";
import { writePersistedAuth } from "@/lib/auth/storage";

function AuthHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // اگر از لندینگ راه‌اندازی با توکن در URL هش ریدایرکت شده
    if (typeof window !== "undefined" && window.location.hash) {
      const match = window.location.hash.match(/auth=([^&]+)/);
      if (match) {
        try {
          const authValue = decodeURIComponent(match[1]);
          const isJwt = authValue.startsWith("Bearer ");
          const payload = isJwt
            ? { method: "jwt" as const, access: authValue.slice(7), savedAt: Date.now() }
            : { method: "token" as const, token: authValue.startsWith("Token ") ? authValue.slice(6) : authValue, savedAt: Date.now() };
          writePersistedAuth(payload);
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        } catch {}
      }
    }
    hydrateAuthFromStorage(dispatch);
  }, [dispatch]);

  return null;
}

export default function Providers({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <AuthHydrator />
      {children}
    </Provider>
  );
}

