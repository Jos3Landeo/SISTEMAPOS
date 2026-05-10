import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/hooks/useAuth";
import { categoryService } from "../services/categoryService";
import { productService } from "../services/productService";
import type { CategoryPayload, ProductPayload } from "../types/product";

export function useProducts(search?: string, enabled = true) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["products", search],
    queryFn: () => productService.list(token ?? "", search),
    enabled: Boolean(token) && enabled,
  });
}

export function useProduct(productId?: string) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => productService.getById(token ?? "", productId ?? ""),
    enabled: Boolean(token && productId),
  });
}

export function useCategories() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.list(token ?? ""),
    enabled: Boolean(token),
  });
}

export function useCreateCategory() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CategoryPayload) => categoryService.create(token ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateCategory() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: string; payload: CategoryPayload }) =>
      categoryService.update(token ?? "", categoryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useCreateProduct() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductPayload) => productService.create(token ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
  });
}

export function useUpdateProduct() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: Partial<ProductPayload> }) =>
      productService.update(token ?? "", productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
  });
}
