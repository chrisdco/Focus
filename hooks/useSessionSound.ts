import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { Audio } from "expo-av";

import { useSettings } from "../context/SettingsContext";

export const useSessionSound = (justCompleted: boolean): void => {
  const { settings } = useSettings();
  const soundRef = useRef<Audio.Sound | null>(null);

  const playCompletionSound = useCallback(async () => {
    if (!settings.soundEnabled) {
      return;
    }

    if (AppState.currentState !== "active") {
      return;
    }

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/complete.mp3"),
        { shouldPlay: true, volume: 0.8 }
      );

      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          void sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch {
      // Audio playback is best-effort; never block the timer flow.
    }
  }, [settings.soundEnabled]);

  useEffect(() => {
    if (justCompleted) {
      void playCompletionSound();
    }
  }, [justCompleted, playCompletionSound]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
      }
    };
  }, []);
};
