import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";

import { useSettings } from "../context/SettingsContext";
import { useTimerContext } from "../context/TimerContext";
import {
  getCurrentSessionNumber,
  getDurationForMode,
  getNextMode,
} from "../domain/timerMachine";
import type { TimerMode } from "../types/timer";

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
  const runningModeRef = useRef<TimerMode>(mode);
  const [justCompleted, setJustCompleted] = useState(false);
  const [completedMode, setCompletedMode] = useState<TimerMode>("focus");

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
    // Reset timing for the current mode (not always focus) so a break
    // reset doesn't jump modes or wipe the long-break counter.
    const currentDuration = getDurationForMode(mode, settings);

    dispatch({ type: "RESET", durationMs: currentDuration });
  }, [dispatch, mode, settings]);

  const skipToMode = useCallback(
    (nextMode: TimerMode, nextCompletedSessions: number) => {
      if (settings.hapticsEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (isRunning) {
        dispatch({ type: "PAUSE", now: Date.now() });
      }

      dispatch({
        type: "SKIP",
        nextMode,
        nextDurationMs: getDurationForMode(nextMode, settings),
        completedFocusSessions: nextCompletedSessions,
      });
    },
    [dispatch, isRunning, settings]
  );

  const skipBreak = useCallback(() => {
    const nextCompleted = mode === "longBreak" ? 0 : completedFocusSessions;
    skipToMode("focus", nextCompleted);
  }, [mode, completedFocusSessions, skipToMode]);

  const skipFocus = useCallback(() => {
    const completedAfter = completedFocusSessions + 1;
    const nextMode = getNextMode(
      "focus",
      completedAfter,
      settings.sessionsBeforeLongBreak
    );

    skipToMode(nextMode, completedAfter);
  }, [completedFocusSessions, settings.sessionsBeforeLongBreak, skipToMode]);

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
    if (isRunning) {
      runningModeRef.current = mode;
    }

    if (wasRunningRef.current && !isRunning && remainingMs === 0) {
      // mode has already advanced; report the mode that just ran.
      setCompletedMode(runningModeRef.current);
      setJustCompleted(true);
      const timeout = setTimeout(() => setJustCompleted(false), 3000);
      wasRunningRef.current = isRunning;
      return () => clearTimeout(timeout);
    }

    wasRunningRef.current = isRunning;
    return undefined;
  }, [isRunning, remainingMs, mode]);

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
    skipBreak,
    skipFocus,
    justCompleted,
    completedMode,
  };
};
