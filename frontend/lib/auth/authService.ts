import type { Dispatch } from "@reduxjs/toolkit";
import { apiClient } from "@/lib/api/apiClient";
import {
  clearPersistedAuth,
  getAuthHeaderValue,
  readPersistedAuth,
  syncLegacyAuthKeys,
  type AuthUser,
  type PersistedAuthV1,
  writePersistedAuth,
} from "./storage";
import { authActions } from "@/lib/store/authSlice";

function applyAuthToApiClient(auth: PersistedAuthV1 | null) {
  const header = getAuthHeaderValue(auth);
  if (header) {
    apiClient.defaults.headers.common["Authorization"] = header;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
}

export function hydrateAuthFromStorage(dispatch: Dispatch) {
  const auth = readPersistedAuth();
  if (auth) {
    // Ensure legacy keys are synced too.
    syncLegacyAuthKeys(auth);
    applyAuthToApiClient(auth);
    dispatch(authActions.setSession(auth));
  } else {
    dispatch(authActions.setSession(null));
  }
  dispatch(authActions.setHydrated(true));
}

export function setTokenAuth(
  dispatch: Dispatch,
  params: { token: string; user?: AuthUser }
) {
  const auth = writePersistedAuth({
    method: "token",
    token: params.token,
    user: params.user,
  });
  applyAuthToApiClient(auth);
  dispatch(authActions.setSession(auth));
  dispatch(authActions.setHydrated(true));
  return auth;
}

export function setJwtAuth(
  dispatch: Dispatch,
  params: { access: string; refresh?: string; user?: AuthUser }
) {
  const auth = writePersistedAuth({
    method: "jwt",
    access: params.access,
    refresh: params.refresh,
    user: params.user,
  });
  applyAuthToApiClient(auth);
  dispatch(authActions.setSession(auth));
  dispatch(authActions.setHydrated(true));
  return auth;
}

export function logout(dispatch: Dispatch) {
  clearPersistedAuth();
  applyAuthToApiClient(null);
  dispatch(authActions.clearSession());
}

