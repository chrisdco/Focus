import { useEffect } from "react";
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

  useEffect(() => {
    if (!justCompleted || !settings.soundEnabled) {
      return;
    }

    if (AppState.currentState !== "active") {
      return;
    }

    const source =
      completedMode === "focus"
        ? getCompletionSource(settings.completionSoundId)
        : getBreakSource(settings.breakSoundId);

    void playCue(source);
  }, [
    completedMode,
    justCompleted,
    settings.breakSoundId,
    settings.completionSoundId,
    settings.soundEnabled,
  ]);
};
