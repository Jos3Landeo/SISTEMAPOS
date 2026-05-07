import { apiFetch } from "../../../lib/api";

import type { AuthResponse, LoginPayload } from "../types/auth";

export const authService = {
  login: (payload: LoginPayload) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

