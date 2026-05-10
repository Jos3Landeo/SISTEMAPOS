import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/hooks/useAuth";
import { settingsService } from "../services/settingsService";
import { useSettingsStore } from "../store/useSettingsStore";
import type { GeneralSettings, ScaleSettings } from "../types/settings";

export function useGeneralSettings() {
  const token = useAuthStore((state) => state.token);
  const setGeneralSettings = useSettingsStore((state) => state.setGeneralSettings);

  const query = useQuery({
    queryKey: ["general-settings"],
    queryFn: () => settingsService.getGeneral(token ?? ""),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) {
      setGeneralSettings(query.data);
    }
  }, [query.data, setGeneralSettings]);

  return query;
}

export function useScaleSettings() {
  const token = useAuthStore((state) => state.token);
  const setScaleSettings = useSettingsStore((state) => state.setScaleSettings);

  const query = useQuery({
    queryKey: ["scale-settings"],
    queryFn: () => settingsService.getScale(token ?? ""),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) {
      setScaleSettings(query.data);
    }
  }, [query.data, setScaleSettings]);

  return query;
}

export function useSaveGeneralSettings() {
  const token = useAuthStore((state) => state.token);
  const setGeneralSettings = useSettingsStore((state) => state.setGeneralSettings);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GeneralSettings) => settingsService.saveGeneral(token ?? "", payload),
    onSuccess: (data) => {
      setGeneralSettings(data);
      queryClient.invalidateQueries({ queryKey: ["general-settings"] });
    },
  });
}

export function useSaveScaleSettings() {
  const token = useAuthStore((state) => state.token);
  const setScaleSettings = useSettingsStore((state) => state.setScaleSettings);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ScaleSettings) => settingsService.saveScale(token ?? "", payload),
    onSuccess: (data) => {
      setScaleSettings(data);
      queryClient.invalidateQueries({ queryKey: ["scale-settings"] });
    },
  });
}
