import { apiFetch } from "../../../lib/api";

export type SalePayload = {
  notes?: string;
  cash_session_id?: string | null;
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
  createSale: (token: string, payload: SalePayload) =>
    apiFetch("/sales", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
};

