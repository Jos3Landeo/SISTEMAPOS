import { apiFetch } from "../../../lib/api";

import type { Category, CategoryPayload } from "../types/product";

export const categoryService = {
  list: (token: string) => apiFetch<Category[]>("/categories", { token }),
  create: (token: string, payload: CategoryPayload) =>
    apiFetch<Category>("/categories", {
      method: "POST",
      token,
      body: JSON.stringify({
        name: payload.name,
        description: payload.description || null,
      }),
    }),
  update: (token: string, categoryId: string, payload: CategoryPayload) =>
    apiFetch<Category>(`/categories/${categoryId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    }),
};
