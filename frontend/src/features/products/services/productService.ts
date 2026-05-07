import { apiFetch } from "../../../lib/api";

import type { Product } from "../types/product";

export const productService = {
  list: (token: string, search?: string) =>
    apiFetch<Product[]>(`/products${search ? `?search=${encodeURIComponent(search)}` : ""}`, { token }),
  lookupByCode: (token: string, code: string) => apiFetch<Product>(`/products/lookup/${encodeURIComponent(code)}`, { token }),
};

