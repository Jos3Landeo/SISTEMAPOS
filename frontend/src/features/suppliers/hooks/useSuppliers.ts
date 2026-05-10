import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/hooks/useAuth";
import { supplierService } from "../services/supplierService";
import type { SupplierPayload } from "../types/supplier";

export function useSuppliers() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => supplierService.list(token ?? ""),
    enabled: Boolean(token),
  });
}

export function useCreateSupplier() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SupplierPayload) => supplierService.create(token ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
}

export function useUpdateSupplier() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ supplierId, payload }: { supplierId: string; payload: SupplierPayload }) =>
      supplierService.update(token ?? "", supplierId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
}
