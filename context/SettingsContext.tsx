import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loadSettings,
  saveSettings,
} from "../storage";
import type { Settings } from "../types/settings";
import { DEFAULT_SETTINGS, normalizeSettings, normalizeSoundMix } from "../types/settings";

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  isHydrated: boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const stored = await loadSettings();
      setSettings(stored);
      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const merged: Partial<Settings> = {
        ...prev,
        ...patch,
        ...(patch.soundMix
          ? { soundMix: normalizeSoundMix(patch.soundMix) }
          : {}),
      };
      // Clamp numeric fields so programmatic callers can't store garbage
      // (UI already clamps, but storage must stay valid).
      const next = normalizeSettings(merged);
      void saveSettings(next).catch(() => undefined);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    void saveSettings(DEFAULT_SETTINGS).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings, isHydrated }),
    [settings, updateSettings, resetSettings, isHydrated]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }

  return context;
};
