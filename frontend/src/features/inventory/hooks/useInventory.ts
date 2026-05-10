import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/hooks/useAuth";
import { inventoryService } from "../services/inventoryService";
import type { StockAdjustmentPayload } from "../types/inventory";

export function useInventoryMovements() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["inventory-movements"],
    queryFn: () => inventoryService.listMovements(token ?? ""),
    enabled: Boolean(token),
  });
}

export function useCreateStockAdjustment() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StockAdjustmentPayload) => inventoryService.createAdjustment(token ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
