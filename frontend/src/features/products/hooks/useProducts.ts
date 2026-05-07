import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/hooks/useAuth";
import { productService } from "../services/productService";

export function useProducts(search?: string) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["products", search],
    queryFn: () => productService.list(token ?? "", search),
    enabled: Boolean(token),
  });
}

