import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/hooks/useAuth";
import { cashierService } from "../services/cashierService";
import type { CashierUserPayload, RolePayload } from "../types/cashier";

export function useRoles() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["cashier-roles"],
    queryFn: () => cashierService.listRoles(token ?? ""),
    enabled: Boolean(token),
  });
}

export function useUsers() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["cashier-users"],
    queryFn: () => cashierService.listUsers(token ?? ""),
    enabled: Boolean(token),
  });
}

export function useCreateRole() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RolePayload) => cashierService.createRole(token ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier-roles"] });
      queryClient.invalidateQueries({ queryKey: ["cashier-users"] });
    },
  });
}

export function useUpdateRole() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: Partial<RolePayload> }) =>
      cashierService.updateRole(token ?? "", roleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier-roles"] });
      queryClient.invalidateQueries({ queryKey: ["cashier-users"] });
    },
  });
}

export function useCreateUser() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CashierUserPayload) => cashierService.createUser(token ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier-users"] });
    },
  });
}

export function useUpdateUser() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: Partial<CashierUserPayload> }) =>
      cashierService.updateUser(token ?? "", userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier-users"] });
    },
  });
}
