import { apiFetch } from "../../../lib/api";

import type { Supplier, SupplierPayload } from "../types/supplier";

export const supplierService = {
  list: (token: string) => apiFetch<Supplier[]>("/suppliers", { token }),
  create: (token: string, payload: SupplierPayload) =>
    apiFetch<Supplier>("/suppliers", {
      method: "POST",
      token,
      body: JSON.stringify({
        ...payload,
        tax_id: payload.tax_id || null,
        phone: payload.phone || null,
        email: payload.email || null,
        address: payload.address || null,
      }),
    }),
  update: (token: string, supplierId: string, payload: SupplierPayload) =>
    apiFetch<Supplier>(`/suppliers/${supplierId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({
        ...payload,
        tax_id: payload.tax_id || null,
        phone: payload.phone || null,
        email: payload.email || null,
        address: payload.address || null,
      }),
    }),
};
