import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";

import { useSettings } from "../context/SettingsContext";
import { useTimerContext } from "../context/TimerContext";
import {
  getCurrentSessionNumber,
  getDurationForMode,
} from "../domain/timerMachine";

const TICK_INTERVAL_MS = 1000;

type IntervalId = ReturnType<typeof setInterval> | null;

export const usePomodoroTimer = () => {
  const {
    state: {
      isRunning,
      remainingMs,
      durationMs,
      expectedEndTime,
      mode,
      completedFocusSessions,
    },
    dispatch,
  } = useTimerContext();
  const { settings } = useSettings();

  const intervalRef = useRef<IntervalId>(null);
  const wasRunningRef = useRef(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const clearIntervalIfNeeded = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isRunning) {
      return;
    }

    if (settings.hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    dispatch({ type: "START", now: Date.now() });
  }, [dispatch, isRunning, settings.hapticsEnabled]);

  const pause = useCallback(() => {
    if (!isRunning) {
      return;
    }

    if (settings.hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    dispatch({ type: "PAUSE", now: Date.now() });
  }, [dispatch, isRunning, settings.hapticsEnabled]);

  const reset = useCallback(() => {
    const focusDuration = getDurationForMode("focus", settings);

    dispatch({ type: "RESET", durationMs: focusDuration });
  }, [dispatch, settings]);

  useEffect(() => {
    if (isRunning && expectedEndTime !== null) {
      if (intervalRef.current !== null) {
        return;
      }

      intervalRef.current = setInterval(() => {
        dispatch({ type: "TICK", now: Date.now() });
      }, TICK_INTERVAL_MS);
    } else {
      clearIntervalIfNeeded();
    }

    return () => {
      clearIntervalIfNeeded();
    };
  }, [isRunning, expectedEndTime, dispatch, clearIntervalIfNeeded]);

  const sessionNumber = getCurrentSessionNumber(
    completedFocusSessions,
    settings.sessionsBeforeLongBreak
  );

  useEffect(() => {
    if (wasRunningRef.current && !isRunning && remainingMs === 0) {
      setJustCompleted(true);
      const timeout = setTimeout(() => setJustCompleted(false), 3000);
      wasRunningRef.current = isRunning;
      return () => clearTimeout(timeout);
    }

    wasRunningRef.current = isRunning;
    return undefined;
  }, [isRunning, remainingMs]);

  return {
    isRunning,
    remainingMs,
    durationMs,
    mode,
    completedFocusSessions,
    sessionNumber,
    sessionsBeforeLongBreak: settings.sessionsBeforeLongBreak,
    start,
    pause,
    reset,
    justCompleted,
  };
};
