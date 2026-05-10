import { apiFetch } from "../../../lib/api";

import type { CashierUser, CashierUserPayload, Role, RolePayload } from "../types/cashier";

export const cashierService = {
  listRoles: (token: string) => apiFetch<Role[]>("/roles", { token }),
  createRole: (token: string, payload: RolePayload) =>
    apiFetch<Role>("/roles", {
      method: "POST",
      token,
      body: JSON.stringify({
        name: payload.name,
        description: payload.description || null,
        permissions: payload.permissions,
      }),
    }),
  updateRole: (token: string, roleId: string, payload: Partial<RolePayload>) =>
    apiFetch<Role>(`/roles/${roleId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({
        ...payload,
        description: payload.description ?? null,
      }),
    }),
  listUsers: (token: string) => apiFetch<CashierUser[]>("/users", { token }),
  createUser: (token: string, payload: CashierUserPayload) =>
    apiFetch<CashierUser>("/users", {
      method: "POST",
      token,
      body: JSON.stringify({
        role_id: payload.role_id,
        full_name: payload.full_name,
        username: payload.username,
        email: payload.email || null,
        password: payload.password,
      }),
    }),
  updateUser: (token: string, userId: string, payload: Partial<CashierUserPayload>) =>
    apiFetch<CashierUser>(`/users/${userId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({
        ...payload,
        email: payload.email ?? null,
      }),
    }),
};
