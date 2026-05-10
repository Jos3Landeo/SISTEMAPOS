import { apiFetch } from "../../../lib/api";

import type { InventoryMovement, StockAdjustmentPayload } from "../types/inventory";

export const inventoryService = {
  listMovements: (token: string) => apiFetch<InventoryMovement[]>("/inventory/movements", { token }),
  createAdjustment: (token: string, payload: StockAdjustmentPayload) =>
    apiFetch("/inventory/adjustments", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
};
