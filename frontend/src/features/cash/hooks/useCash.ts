import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/hooks/useAuth";
import { cashService } from "../services/cashService";
import type { CloseCashSessionPayload, CreateCashMovementPayload, OpenCashSessionPayload, ReopenCashSessionPayload } from "../types/cash";

export function useCashRegisters() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["cash-registers"],
    queryFn: () => cashService.listRegisters(token ?? ""),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}

export function useCurrentCashSession(enabled = true) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["cash-current-session"],
    queryFn: () => cashService.getCurrentSession(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 10_000,
  });
}

export function useCashReasonCatalog(reasonType?: string, enabled = true) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["cash-reasons", reasonType],
    queryFn: () => cashService.listReasons(token ?? "", reasonType),
    enabled: Boolean(token) && enabled,
    staleTime: 300_000,
  });
}

export function useClosedCashSessions(enabled = true) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["cash-closed-sessions"],
    queryFn: () => cashService.listClosedSessions(token ?? ""),
    enabled: Boolean(token) && enabled,
  });
}

export function useOpenCashSession() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OpenCashSessionPayload) => cashService.openSession(token ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-current-session"] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      queryClient.invalidateQueries({ queryKey: ["cash-closed-sessions"] });
    },
  });
}

export function useCloseCashSession() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: CloseCashSessionPayload }) =>
      cashService.closeSession(token ?? "", sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-current-session"] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
    },
  });
}

export function useCreateCashMovement() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: CreateCashMovementPayload }) =>
      cashService.createMovement(token ?? "", sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-current-session"] });
      queryClient.invalidateQueries({ queryKey: ["cash-closed-sessions"] });
    },
  });
}

export function useReopenCashSession() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: ReopenCashSessionPayload }) =>
      cashService.reopenSession(token ?? "", sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-current-session"] });
      queryClient.invalidateQueries({ queryKey: ["cash-closed-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
    },
  });
}
