import { apiFetch } from "../../../lib/api";
import type { SaleListItem, SaleReceipt } from "../types/pos";

export type SalePayload = {
  notes?: string;
  cash_session_id?: string | null;
  discount_amount?: number;
  details: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_amount: number;
  }>;
  payments: Array<{
    payment_method_id: string;
    amount: number;
    reference?: string;
  }>;
};

export const posService = {
  listSales: (token: string) => apiFetch<SaleListItem[]>("/sales", { token }),
  createSale: (token: string, payload: SalePayload) =>
    apiFetch<SaleReceipt>("/sales", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
  getLatestSale: (token: string, cashSessionId?: string | null) =>
    apiFetch<SaleReceipt>(`/sales/latest${cashSessionId ? `?cash_session_id=${encodeURIComponent(cashSessionId)}` : ""}`, {
      token,
    }),
};
