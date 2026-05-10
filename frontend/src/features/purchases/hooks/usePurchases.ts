import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/hooks/useAuth";
import { supplierService } from "../../suppliers/services/supplierService";
import { purchaseService } from "../services/purchaseService";
import type { PurchasePayload } from "../types/purchase";

export function usePurchases() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["purchases"],
    queryFn: () => purchaseService.list(token ?? ""),
    enabled: Boolean(token),
  });
}

export function useSuppliers() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => supplierService.list(token ?? ""),
    enabled: Boolean(token),
  });
}

export function useCreatePurchase() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PurchasePayload) => purchaseService.create(token ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
