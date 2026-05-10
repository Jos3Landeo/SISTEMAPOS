import { apiFetch } from "../../../lib/api";

import type { Product, ProductPayload } from "../types/product";

export const productService = {
  list: (token: string, search?: string) =>
    apiFetch<Product[]>(`/products${search ? `?search=${encodeURIComponent(search)}` : ""}`, { token }),
  getById: (token: string, productId: string) => apiFetch<Product>(`/products/${productId}`, { token }),
  lookupByCode: (token: string, code: string, field?: "barcode" | "internal_code") =>
    apiFetch<Product>(
      `/products/lookup/${encodeURIComponent(code)}${field ? `?field=${encodeURIComponent(field)}` : ""}`,
      { token },
    ),
  create: (token: string, payload: ProductPayload) =>
    apiFetch<Product>("/products", {
      method: "POST",
      token,
      body: JSON.stringify({
        ...payload,
        category_id: payload.category_id || null,
        internal_code: payload.internal_code || null,
        description: payload.description || null,
      }),
    }),
  update: (token: string, productId: string, payload: Partial<ProductPayload>) =>
    apiFetch<Product>(`/products/${productId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({
        ...payload,
        category_id: payload.category_id || null,
        internal_code: payload.internal_code || null,
        description: payload.description ?? null,
      }),
    }),
};
