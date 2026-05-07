import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/hooks/useAuth";
import { inventoryService } from "../services/inventoryService";

export function useInventoryMovements() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["inventory-movements"],
    queryFn: () => inventoryService.listMovements(token ?? ""),
    enabled: Boolean(token),
  });
}

