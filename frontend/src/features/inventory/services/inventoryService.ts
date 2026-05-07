import { apiFetch } from "../../../lib/api";

import type { InventoryMovement } from "../types/inventory";

export const inventoryService = {
  listMovements: (token: string) => apiFetch<InventoryMovement[]>("/inventory/movements", { token }),
};

