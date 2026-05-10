import { apiFetch } from "../../../lib/api";

import type { Purchase, PurchasePayload } from "../types/purchase";

export const purchaseService = {
  list: (token: string) => apiFetch<Purchase[]>("/purchases", { token }),
  create: (token: string, payload: PurchasePayload) =>
    apiFetch<Purchase>("/purchases", {
      method: "POST",
      token,
      body: JSON.stringify({
        ...payload,
        invoice_number: payload.invoice_number || null,
        notes: payload.notes || null,
      }),
    }),
};
