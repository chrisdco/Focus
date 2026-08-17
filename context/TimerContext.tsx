import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";

import { getNextMode } from "../domain/timerMachine";
import type { Settings } from "../types/settings";
import { DEFAULT_SETTINGS } from "../types/settings";
import type { TimerAction, TimerSnapshot, TimerState } from "../types/timer";
import { createInitialTimerState } from "../utils/timer";

interface TimerContextValue {
  state: TimerState;
  dispatch: React.Dispatch<TimerAction>;
  settings: Settings;
  setSettingsRef: (settings: Settings) => void;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

const timerReducer = (state: TimerState, action: TimerAction): TimerState => {
  switch (action.type) {
    case "START": {
      if (state.isRunning) {
        return state;
      }

      const remainingMs =
        state.remainingMs > 0 ? state.remainingMs : state.durationMs;

      const expectedEndTime = action.now + remainingMs;

      return {
        ...state,
        isRunning: true,
        remainingMs,
        expectedEndTime,
      };
    }
    case "PAUSE": {
      if (!state.isRunning || state.expectedEndTime === null) {
        return state;
      }

      const remainingMs = Math.max(0, state.expectedEndTime - action.now);

      return {
        ...state,
        isRunning: false,
        remainingMs,
        expectedEndTime: null,
      };
    }
    case "RESET": {
      return {
        ...createInitialTimerState(),
        durationMs: action.durationMs,
        remainingMs: action.durationMs,
      };
    }
    case "TICK": {
      if (!state.isRunning || state.expectedEndTime === null) {
        return state;
      }

      const remainingMs = Math.max(0, state.expectedEndTime - action.now);

      if (remainingMs === state.remainingMs) {
        return state;
      }

      if (remainingMs <= 0) {
        return {
          ...state,
          isRunning: false,
          remainingMs: 0,
          expectedEndTime: null,
        };
      }

      return {
        ...state,
        remainingMs,
      };
    }
    case "COMPLETE_SESSION": {
      const wasFocus = state.mode === "focus";
      let completedFocusSessions = state.completedFocusSessions;

      if (wasFocus) {
        completedFocusSessions += 1;
      }

      const nextMode = getNextMode(
        state.mode,
        completedFocusSessions,
        action.sessionsBeforeLongBreak
      );

      if (state.mode === "longBreak") {
        completedFocusSessions = 0;
      }

      return {
        ...state,
        isRunning: false,
        mode: nextMode,
        completedFocusSessions,
        durationMs: action.nextDurationMs,
        remainingMs: action.nextDurationMs,
        expectedEndTime: null,
      };
    }
    case "SWITCH_MODE": {
      return {
        ...state,
        isRunning: false,
        mode: action.mode,
        durationMs: action.durationMs,
        remainingMs: action.durationMs,
        expectedEndTime: null,
      };
    }
    case "SKIP": {
      return {
        ...state,
        isRunning: false,
        mode: action.nextMode,
        completedFocusSessions: action.completedFocusSessions,
        durationMs: action.nextDurationMs,
        remainingMs: action.nextDurationMs,
        expectedEndTime: null,
      };
    }
    case "HYDRATE": {
      const snapshot = action.snapshot;
      const now = Date.now();

      if (
        snapshot.isRunning &&
        snapshot.expectedEndTime !== null &&
        snapshot.expectedEndTime <= now
      ) {
        return {
          ...state,
          ...snapshot,
          isRunning: false,
          remainingMs: 0,
          expectedEndTime: null,
        };
      }

      if (snapshot.isRunning && snapshot.expectedEndTime !== null) {
        const remainingMs = Math.max(0, snapshot.expectedEndTime - now);
        return {
          ...state,
          ...snapshot,
          remainingMs,
        };
      }

      return {
        ...state,
        ...snapshot,
      };
    }
    default: {
      return state;
    }
  }
};

interface TimerProviderProps {
  children: ReactNode;
  initialSnapshot?: TimerSnapshot | null;
  settings?: Settings;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({
  children,
  initialSnapshot = null,
  settings = DEFAULT_SETTINGS,
}) => {
  const settingsRef = useRef(settings);

  const [state, dispatch] = useReducer(timerReducer, undefined, () => {
    const initial = createInitialTimerState(settings);

    if (initialSnapshot) {
      const now = Date.now();

      if (
        initialSnapshot.isRunning &&
        initialSnapshot.expectedEndTime !== null &&
        initialSnapshot.expectedEndTime > now
      ) {
        return {
          ...initial,
          ...initialSnapshot,
          remainingMs: Math.max(
            0,
            initialSnapshot.expectedEndTime - now
          ),
        };
      }

      if (
        initialSnapshot.isRunning &&
        initialSnapshot.expectedEndTime !== null &&
        initialSnapshot.expectedEndTime <= now
      ) {
        return {
          ...initial,
          ...initialSnapshot,
          isRunning: false,
          remainingMs: 0,
          expectedEndTime: null,
        };
      }

      return { ...initial, ...initialSnapshot };
    }

    return initial;
  });

  const setSettingsRef = useCallback((nextSettings: Settings) => {
    settingsRef.current = nextSettings;
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  return (
    <TimerContext.Provider
      value={{ state, dispatch, settings: settingsRef.current, setSettingsRef }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimerContext = (): TimerContextValue => {
  const context = useContext(TimerContext);

  if (!context) {
    throw new Error("useTimerContext must be used within a TimerProvider");
  }

  return context;
};

export const toTimerSnapshot = (state: TimerState): TimerSnapshot => ({
  isRunning: state.isRunning,
  durationMs: state.durationMs,
  remainingMs: state.remainingMs,
  expectedEndTime: state.expectedEndTime,
  mode: state.mode,
  completedFocusSessions: state.completedFocusSessions,
});
