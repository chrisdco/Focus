import { useCallback, useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";

import { useSettings } from "../context/SettingsContext";
import { useStats } from "../context/StatsContext";
import { useTasks } from "../context/TasksContext";
import {
  toTimerSnapshot,
  useTimerContext,
} from "../context/TimerContext";
import { getDurationForMode, getNextMode } from "../domain/timerMachine";
import type { TimerMode } from "../types/timer";
import {
  clearTimerSnapshot,
  loadTimerSnapshot,
  saveTimerSnapshot,
} from "../storage";

export const useTimerPersistence = (): void => {
  const { state, dispatch } = useTimerContext();
  const { settings } = useSettings();
  const { logSession } = useStats();
  const { activeTaskId, incrementTaskPomodoros } = useTasks();
  const prevStateRef = useRef(state);
  const handlingCompletionRef = useRef(false);
  const expiredHandledRef = useRef(false);

  const recordFocusCompletion = useCallback(
    (durationMs: number) => {
      logSession("focus", durationMs, activeTaskId ?? undefined);

      if (activeTaskId) {
        incrementTaskPomodoros(activeTaskId);
      }

      if (settings.hapticsEnabled) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }
    },
    [activeTaskId, incrementTaskPomodoros, logSession, settings.hapticsEnabled]
  );

  const completeAndAdvance = useCallback(
    (mode: TimerMode, completedFocusSessions: number, durationMs: number) => {
      if (mode === "focus") {
        recordFocusCompletion(durationMs);
      }

      const completedAfter =
        mode === "focus"
          ? completedFocusSessions + 1
          : completedFocusSessions;

      const nextMode = getNextMode(
        mode,
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

      if (settings.autoStartNextSession) {
        dispatch({ type: "START", now: Date.now() });
      }
    },
    [dispatch, recordFocusCompletion, settings]
  );

  const persistSnapshot = useCallback(async () => {
    await saveTimerSnapshot(toTimerSnapshot(state));
  }, [state]);

  useEffect(() => {
    if (expiredHandledRef.current) {
      return;
    }

    const handleExpiredSnapshot = async () => {
      const snapshot = await loadTimerSnapshot();

      expiredHandledRef.current = true;

      if (
        !snapshot?.isRunning ||
        snapshot.expectedEndTime === null ||
        snapshot.expectedEndTime > Date.now()
      ) {
        return;
      }

      handlingCompletionRef.current = true;
      completeAndAdvance(
        snapshot.mode,
        snapshot.completedFocusSessions,
        snapshot.durationMs
      );
      handlingCompletionRef.current = false;
    };

    void handleExpiredSnapshot();
  }, [completeAndAdvance]);

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
      completeAndAdvance(prev.mode, prev.completedFocusSessions, prev.durationMs);
      handlingCompletionRef.current = false;
    }

    prevStateRef.current = state;
  }, [state, persistSnapshot, completeAndAdvance]);

  useEffect(() => {
    if (!state.isRunning && state.remainingMs === state.durationMs) {
      void clearTimerSnapshot();
    }
  }, [state.isRunning, state.remainingMs, state.durationMs]);
};
