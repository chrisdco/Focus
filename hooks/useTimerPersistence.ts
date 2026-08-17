import { useCallback, useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";

import { useSettings } from "../context/SettingsContext";
import { useStats } from "../context/StatsContext";
import {
  toTimerSnapshot,
  useTimerContext,
} from "../context/TimerContext";
import { getDurationForMode, getNextMode } from "../domain/timerMachine";
import {
  clearTimerSnapshot,
  loadTimerSnapshot,
  saveTimerSnapshot,
} from "../storage";

export const useTimerPersistence = (): void => {
  const { state, dispatch } = useTimerContext();
  const { settings } = useSettings();
  const { logSession } = useStats();
  const prevStateRef = useRef(state);
  const handlingCompletionRef = useRef(false);
  const expiredHandledRef = useRef(false);

  const persistSnapshot = useCallback(async () => {
    await saveTimerSnapshot(toTimerSnapshot(state));
  }, [state]);

  useEffect(() => {
    if (expiredHandledRef.current) {
      return;
    }

    const handleExpiredSnapshot = async () => {
      const snapshot = await loadTimerSnapshot();

      if (
        !snapshot?.isRunning ||
        snapshot.expectedEndTime === null ||
        snapshot.expectedEndTime > Date.now()
      ) {
        expiredHandledRef.current = true;
        return;
      }

      expiredHandledRef.current = true;
      handlingCompletionRef.current = true;

      if (snapshot.mode === "focus") {
        logSession("focus", snapshot.durationMs);

        if (settings.hapticsEnabled) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
        }
      }

      const completedAfter =
        snapshot.mode === "focus"
          ? snapshot.completedFocusSessions + 1
          : snapshot.completedFocusSessions;

      const nextMode = getNextMode(
        snapshot.mode,
        completedAfter,
        settings.sessionsBeforeLongBreak
      );
      const nextDurationMs = getDurationForMode(nextMode, settings);

      dispatch({
        type: "COMPLETE_SESSION",
        now: Date.now(),
        nextDurationMs,
        sessionsBeforeLongBreak: settings.sessionsBeforeLongBreak,
      });

      handlingCompletionRef.current = false;
    };

    void handleExpiredSnapshot();
  }, [dispatch, logSession, settings]);

  useEffect(() => {
    const prev = prevStateRef.current;

    const semanticChange =
      prev.isRunning !== state.isRunning ||
      prev.mode !== state.mode ||
      prev.completedFocusSessions !== state.completedFocusSessions ||
      (prev.remainingMs !== state.remainingMs &&
        (!state.isRunning || prev.isRunning !== state.isRunning));

    if (semanticChange) {
      void persistSnapshot();
    }

    if (
      prev.isRunning &&
      !state.isRunning &&
      state.remainingMs === 0 &&
      !handlingCompletionRef.current
    ) {
      handlingCompletionRef.current = true;

      if (prev.mode === "focus") {
        logSession("focus", prev.durationMs);

        if (settings.hapticsEnabled) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
        }
      }

      const completedAfter =
        prev.mode === "focus"
          ? prev.completedFocusSessions + 1
          : prev.completedFocusSessions;

      const nextMode = getNextMode(
        prev.mode,
        completedAfter,
        settings.sessionsBeforeLongBreak
      );
      const nextDurationMs = getDurationForMode(nextMode, settings);

      dispatch({
        type: "COMPLETE_SESSION",
        now: Date.now(),
        nextDurationMs,
        sessionsBeforeLongBreak: settings.sessionsBeforeLongBreak,
      });

      handlingCompletionRef.current = false;
    }

    prevStateRef.current = state;
  }, [state, persistSnapshot, logSession, settings, dispatch]);

  useEffect(() => {
    if (!state.isRunning && state.remainingMs === state.durationMs) {
      void clearTimerSnapshot();
    }
  }, [state.isRunning, state.remainingMs, state.durationMs]);
};
