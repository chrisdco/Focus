import type { ReactNode } from "react";
import React, { createContext, useContext, useMemo } from "react";

import { useSettings } from "./SettingsContext";
import { useTimerContext } from "./TimerContext";

interface FocusModeContextValue {
  isFocusMode: boolean;
}

const FocusModeContext = createContext<FocusModeContextValue | undefined>(
  undefined
);

interface FocusModeProviderProps {
  children: ReactNode;
}

export const FocusModeProvider: React.FC<FocusModeProviderProps> = ({
  children,
}) => {
  const { settings } = useSettings();
  const { state } = useTimerContext();

  const value = useMemo(
    () => ({
      isFocusMode:
        settings.autoEnterFocusMode &&
        state.isRunning &&
        state.mode === "focus",
    }),
    [settings.autoEnterFocusMode, state.isRunning, state.mode]
  );

  return (
    <FocusModeContext.Provider value={value}>
      {children}
    </FocusModeContext.Provider>
  );
};

export const useFocusMode = (): FocusModeContextValue => {
  const context = useContext(FocusModeContext);

  if (!context) {
    throw new Error("useFocusMode must be used within a FocusModeProvider");
  }

  return context;
};
