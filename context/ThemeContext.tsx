import type { ReactNode } from "react";
import React, { createContext, useContext, useMemo } from "react";
import { StatusBar } from "expo-status-bar";

import {
  darkColors,
  getModeColors,
  lightColors,
  type ColorPalette,
} from "../theme/colors";
import { getAccentColor, getAccentGradient } from "../theme/accents";
import type { TimerMode } from "../types/timer";
import { useSettings } from "./SettingsContext";

interface ThemeContextValue {
  colors: ColorPalette;
  modeColors: Record<TimerMode, string>;
  /** Signature gradient for primary CTAs; follows the accent. */
  gradient: [string, string];
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { settings } = useSettings();

  const value = useMemo<ThemeContextValue>(() => {
    const base = settings.darkMode ? darkColors : lightColors;
    const palette: ColorPalette = {
      ...base,
      focus: getAccentColor(settings.accentId),
    };
    return {
      colors: palette,
      modeColors: getModeColors(palette),
      gradient: getAccentGradient(settings.accentId),
      isDark: settings.darkMode,
    };
  }, [settings.accentId, settings.darkMode]);

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={value.isDark ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
