import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/hooks/useAuth";
import { apiFetch } from "../../../lib/api";
import { posService, type SalePayload } from "../services/posService";

type PaymentMethod = {
  id: string;
  name: string;
  code: string;
};

export function usePaymentMethods() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => apiFetch<PaymentMethod[]>("/payment-methods", { token: token ?? "" }),
    enabled: Boolean(token),
  });
}

export function useCreateSale() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SalePayload) => posService.createSale(token ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

