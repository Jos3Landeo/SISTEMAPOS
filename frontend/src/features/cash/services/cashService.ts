import { apiFetch } from "../../../lib/api";

import type {
  CashReasonCatalogItem,
  CashRegister,
  CashSessionClosure,
  CashSession,
  CloseCashSessionPayload,
  CreateCashMovementPayload,
  OpenCashSessionPayload,
  ReopenCashSessionPayload,
} from "../types/cash";

export const cashService = {
  listRegisters: (token: string) => apiFetch<CashRegister[]>("/cash/registers", { token }),
  listReasons: (token: string, reasonType?: string) =>
    apiFetch<CashReasonCatalogItem[]>(`/cash/reasons${reasonType ? `?reason_type=${encodeURIComponent(reasonType)}` : ""}`, { token }),
  getCurrentSession: (token: string) => apiFetch<CashSession | null>("/cash/sessions/current", { token }),
  listClosedSessions: (token: string) => apiFetch<CashSessionClosure[]>("/cash/sessions/closed", { token }),
  openSession: (token: string, payload: OpenCashSessionPayload) =>
    apiFetch<CashSession>("/cash/sessions/open", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
  createMovement: (token: string, sessionId: string, payload: CreateCashMovementPayload) =>
    apiFetch<CashSession>(`/cash/sessions/${sessionId}/movements`, {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
  closeSession: (token: string, sessionId: string, payload: CloseCashSessionPayload) =>
    apiFetch<CashSession>(`/cash/sessions/${sessionId}/close`, {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
  reopenSession: (token: string, sessionId: string, payload: ReopenCashSessionPayload) =>
    apiFetch<CashSession>(`/cash/sessions/${sessionId}/reopen`, {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
};
