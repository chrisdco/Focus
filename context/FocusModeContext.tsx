import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSettings } from "./SettingsContext";
import { useTimerContext } from "./TimerContext";

interface FocusModeContextValue {
  isFocusMode: boolean;
  /** Flip the effective state; sticky until the session transitions. */
  toggleFocusMode: () => void;
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
  // Manual override; cleared on every session transition so it can never
  // strand the UI (e.g. stuck fullscreen while browsing stats).
  const [override, setOverride] = useState<boolean | null>(null);

  useEffect(() => {
    setOverride(null);
  }, [state.isRunning, state.mode]);

  const auto =
    settings.autoEnterFocusMode &&
    state.isRunning &&
    state.mode === "focus";
  const isFocusMode = override ?? auto;

  const toggleFocusMode = useCallback(() => {
    setOverride(!isFocusMode);
  }, [isFocusMode]);

  const value = useMemo(
    () => ({ isFocusMode, toggleFocusMode }),
    [isFocusMode, toggleFocusMode]
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
