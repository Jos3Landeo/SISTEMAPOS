import { apiFetch } from "../../../lib/api";

import type { CajaDiariaFilters, CajaDiariaReport, SaleDetailReport, VentasDiaFilters, VentasDiaReport } from "../types/report";

function buildQuery(filters: VentasDiaFilters) {
  const params = new URLSearchParams();
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.payment_method_id) {
    params.set("payment_method_id", filters.payment_method_id);
  }
  if (filters.user_id) {
    params.set("user_id", filters.user_id);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function buildCashDailyQuery(filters: CajaDiariaFilters) {
  const params = new URLSearchParams();
  if (filters.session_id) {
    params.set("session_id", filters.session_id);
  }
  if (filters.user_id) {
    params.set("user_id", filters.user_id);
  }
  if (filters.report_date) {
    params.set("report_date", filters.report_date);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const reportService = {
  getVentasDia: (token: string, filters: VentasDiaFilters) =>
    apiFetch<VentasDiaReport>(`/reports/ventas-dia${buildQuery(filters)}`, { token }),
  getCajaDiaria: (token: string, filters: CajaDiariaFilters = {}) =>
    apiFetch<CajaDiariaReport>(`/reports/caja-diaria${buildCashDailyQuery(filters)}`, { token }),
  getSaleDetail: (token: string, saleId: string) => apiFetch<SaleDetailReport>(`/sales/${saleId}`, { token }),
  cancelSale: (token: string, saleId: string, payload: { reason_code: string; notes?: string }) =>
    apiFetch<SaleDetailReport>(`/sales/${saleId}/cancel`, {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
};
