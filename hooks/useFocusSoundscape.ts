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
  const lastMixKeyRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    return () => {
      subscription.remove();
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
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

    // Stabilize on serialized mix so slider identity churn doesn't restart
    // fades on every render; only react to real content changes.
    const mixKey = JSON.stringify(soundMix);

    if (shouldPlay && !wasPlayingRef.current) {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      fadeInMix(soundMix);
      wasPlayingRef.current = true;
      lastMixKeyRef.current = mixKey;
      return;
    }

    if (shouldPlay && wasPlayingRef.current && mixKey !== lastMixKeyRef.current) {
      // Mix changed mid-session (e.g. slider drag): debounce the re-fade so
      // rapid ticks don't thrash fade timers.
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        fadeInMix(soundMix);
        lastMixKeyRef.current = mixKey;
      }, 250);
      return;
    }

    if (!shouldPlay && wasPlayingRef.current) {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      fadeOutMix();
      wasPlayingRef.current = false;
      lastMixKeyRef.current = null;
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
