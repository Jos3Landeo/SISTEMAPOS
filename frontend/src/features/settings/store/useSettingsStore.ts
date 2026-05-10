import { create } from "zustand";

import { defaultGeneralSettings, defaultScaleSettings, type GeneralSettings, type ScaleSettings } from "../types/settings";

type SettingsState = {
  general: GeneralSettings;
  scale: ScaleSettings;
  setGeneralSettings: (settings: GeneralSettings) => void;
  setScaleSettings: (settings: ScaleSettings) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  general: defaultGeneralSettings,
  scale: defaultScaleSettings,
  setGeneralSettings: (general) => {
    set({ general });
  },
  setScaleSettings: (scale) => {
    set({ scale });
  },
}));
