import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useSoundscape } from "../context/SoundscapeContext";
import { useSettings } from "../context/SettingsContext";
import { useTimerContext } from "../context/TimerContext";
import type { TimerMode } from "../types/timer";

const shouldPlayForMode = (
  mode: TimerMode,
  isRunning: boolean,
  continueOnBreak: boolean
): boolean => {
  if (!isRunning) {
    return false;
  }

  if (mode === "focus") {
    return true;
  }

  return continueOnBreak;
};

export const useFocusSoundscape = (): void => {
  const { settings } = useSettings();
  const { state } = useTimerContext();
  const { fadeInMix, fadeOutMix } = useSoundscape();
  const wasPlayingRef = useRef(false);
  const [appIsActive, setAppIsActive] = useState(
    AppState.currentState === "active"
  );

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        setAppIsActive(nextState === "active");
      }
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const {
      ambientSoundEnabled,
      autoPlaySoundscape,
      continueSoundscapeOnBreak,
      soundMix,
    } = settings;

    const shouldPlay =
      ambientSoundEnabled &&
      autoPlaySoundscape &&
      appIsActive &&
      shouldPlayForMode(
        state.mode,
        state.isRunning,
        continueSoundscapeOnBreak
      );

    if (shouldPlay && !wasPlayingRef.current) {
      fadeInMix(soundMix);
      wasPlayingRef.current = true;
      return;
    }

    if (!shouldPlay && wasPlayingRef.current) {
      fadeOutMix();
      wasPlayingRef.current = false;
    }
  }, [
    appIsActive,
    fadeInMix,
    fadeOutMix,
    settings.ambientSoundEnabled,
    settings.autoPlaySoundscape,
    settings.continueSoundscapeOnBreak,
    settings.soundMix,
    state.isRunning,
    state.mode,
  ]);
};
