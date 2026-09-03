import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { getBreakSource, getCompletionSource } from "../data/cueSounds";
import { useSettings } from "../context/SettingsContext";
import type { TimerMode } from "../types/timer";
import { playCue } from "../utils/playCue";

export const useSessionSound = (
  justCompleted: boolean,
  completedMode: TimerMode
): void => {
  const { settings } = useSettings();
  const pendingRef = useRef<TimerMode | null>(null);

  useEffect(() => {
    if (!justCompleted || !settings.soundEnabled) {
      return;
    }

    const source =
      completedMode === "focus"
        ? getCompletionSource(settings.completionSoundId)
        : getBreakSource(settings.breakSoundId);

    // If backgrounded, defer until the app is active again instead of
    // dropping the cue silently.
    if (AppState.currentState !== "active") {
      pendingRef.current = completedMode;
      const sub = AppState.addEventListener("change", (next) => {
        if (next === "active" && pendingRef.current !== null) {
          pendingRef.current = null;
          void playCue(source).catch(() => undefined);
          sub.remove();
        }
      });
      return () => sub.remove();
    }

    void playCue(source).catch(() => undefined);
  }, [
    completedMode,
    justCompleted,
    settings.breakSoundId,
    settings.completionSoundId,
    settings.soundEnabled,
  ]);
};
