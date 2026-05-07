import { create } from "zustand";

import type { AuthResponse, User } from "../types/auth";

type AuthState = {
  token: string | null;
  user: User | null;
  setSession: (session: AuthResponse) => void;
  clearSession: () => void;
};

const storageKey = "sistema-pos-auth";

function loadSession() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return { token: null, user: null };
  }

  try {
    return JSON.parse(raw) as { token: string | null; user: User | null };
  } catch {
    return { token: null, user: null };
  }
}

const initialState = typeof window === "undefined" ? { token: null, user: null } : loadSession();

export const useAuthStore = create<AuthState>((set) => ({
  token: initialState.token,
  user: initialState.user,
  setSession: (session) => {
    const nextState = { token: session.access_token, user: session.user };
    localStorage.setItem(storageKey, JSON.stringify(nextState));
    set(nextState);
  },
  clearSession: () => {
    localStorage.removeItem(storageKey);
    set({ token: null, user: null });
  },
}));

