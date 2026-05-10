import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/hooks/useAuth";
import { reportService } from "../services/reportService";
import type { CajaDiariaFilters, VentasDiaFilters } from "../types/report";

export function useVentasDiaReport(filters: VentasDiaFilters, enabled = true) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["report-ventas-dia", filters],
    queryFn: () => reportService.getVentasDia(token ?? "", filters),
    enabled: Boolean(token) && enabled,
  });
}

export function useSaleDetailReport(saleId: string | null, enabled = true) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["report-sale-detail", saleId],
    queryFn: () => reportService.getSaleDetail(token ?? "", saleId ?? ""),
    enabled: Boolean(token && saleId) && enabled,
  });
}

export function useCajaDiariaReport(filters: CajaDiariaFilters = {}, enabled = true) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["report-caja-diaria", filters],
    queryFn: () => reportService.getCajaDiaria(token ?? "", filters),
    enabled: Boolean(token) && enabled,
  });
}
