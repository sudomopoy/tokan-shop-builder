import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PersistedAuthV1, AuthUser } from "@/lib/auth/storage";

export type AuthState = {
  hydrated: boolean;
  session: PersistedAuthV1 | null;
};

const initialState: AuthState = {
  hydrated: false,
  session: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<PersistedAuthV1 | null>) {
      state.session = action.payload;
    },
    setHydrated(state, action: PayloadAction<boolean>) {
      state.hydrated = action.payload;
    },
    setUser(state, action: PayloadAction<AuthUser | undefined>) {
      if (!state.session) {
        return;
      }
      state.session.user = action.payload;
    },
    clearSession(state) {
      state.session = null;
      state.hydrated = true;
    },
  },
});

export const authActions = authSlice.actions;
export const authReducer = authSlice.reducer;

// Selectors (keep these simple so widgets can reuse them)
export const selectAuthSession = (state: { auth: AuthState }) => state.auth.session;
export const selectAuthHydrated = (state: { auth: AuthState }) => state.auth.hydrated;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  Boolean(state.auth.session && (state.auth.session.token || state.auth.session.access));
export const selectAuthUser = (state: { auth: AuthState }) => state.auth.session?.user;

