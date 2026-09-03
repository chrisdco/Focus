import { useCallback, useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";

import { useSettings } from "../context/SettingsContext";
import { useStats } from "../context/StatsContext";
import { useTasks } from "../context/TasksContext";
import { toTimerSnapshot, useTimerContext } from "../context/TimerContext";
import { getDurationForMode, getNextMode } from "../domain/timerMachine";
import type { TimerMode } from "../types/timer";
import { saveTimerSnapshot } from "../storage";

export const useTimerPersistence = (): void => {
  const { state, dispatch } = useTimerContext();
  const { settings } = useSettings();
  const { logSession } = useStats();
  const { activeTaskId, incrementTaskPomodoros } = useTasks();
  const prevStateRef = useRef(state);
  // Dedupe key for the last logged completion (mode/counter/end-time).
  const handledCompletionRef = useRef<string | null>(null);

  const recordFocusCompletion = useCallback(
    (durationMs: number) => {
      logSession("focus", durationMs, activeTaskId ?? undefined);

      if (activeTaskId) {
        incrementTaskPomodoros(activeTaskId);
      }

      if (settings.hapticsEnabled) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => undefined);
      }
    },
    [activeTaskId, incrementTaskPomodoros, logSession, settings.hapticsEnabled]
  );

  const completeAndAdvance = useCallback(
    (
      mode: TimerMode,
      completedFocusSessions: number,
      durationMs: number,
      completionKey: string
    ) => {
      if (handledCompletionRef.current === completionKey) {
        return;
      }
      handledCompletionRef.current = completionKey;

      if (mode === "focus") {
        recordFocusCompletion(durationMs);
      }

      const completedAfter =
        mode === "focus" ? completedFocusSessions + 1 : completedFocusSessions;

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
        // Defer so the paused-at-zero state commits first: celebration,
        // sound, and TICK effects observe the completion before running on.
        const id = setTimeout(() => {
          dispatch({ type: "START", now: Date.now() });
        }, 0);
        void id;
      }
    },
    [dispatch, recordFocusCompletion, settings]
  );

  const persistSnapshot = useCallback(async () => {
    try {
      await saveTimerSnapshot(toTimerSnapshot(state));
    } catch {
      // Storage failures are logged in storage layer; never break timer.
    }
  }, [state]);

  // Expired snapshot restored from boot (stays isRunning with remaining 0):
  // log it exactly once from state — no second storage read.
  useEffect(() => {
    if (
      state.isRunning &&
      state.remainingMs === 0 &&
      state.expectedEndTime !== null &&
      state.expectedEndTime <= Date.now()
    ) {
      const key = `${state.mode}-${state.completedFocusSessions}-${state.expectedEndTime}`;
      completeAndAdvance(
        state.mode,
        state.completedFocusSessions,
        state.durationMs,
        key
      );
    }
    // Only on mount / relevant transitions; completeAndAdvance is stable-ish.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const prev = prevStateRef.current;

    const semanticChange =
      prev.isRunning !== state.isRunning ||
      prev.mode !== state.mode ||
      prev.completedFocusSessions !== state.completedFocusSessions ||
      (prev.remainingMs !== state.remainingMs &&
        (!state.isRunning || prev.isRunning !== state.isRunning));

    if (semanticChange) {
      void persistSnapshot().catch(() => undefined);
    }

    if (prev.isRunning && !state.isRunning && state.remainingMs === 0) {
      const key = `${prev.mode}-${prev.completedFocusSessions}-${prev.expectedEndTime ?? prev.durationMs}`;
      completeAndAdvance(
        prev.mode,
        prev.completedFocusSessions,
        prev.durationMs,
        key
      );
    }

    prevStateRef.current = state;
  }, [state, persistSnapshot, completeAndAdvance]);
};
