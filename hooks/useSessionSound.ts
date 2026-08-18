import { useEffect } from "react";
import { AppState } from "react-native";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";

import { useSettings } from "../context/SettingsContext";

export const useSessionSound = (justCompleted: boolean): void => {
  const { settings } = useSettings();
  const player = useAudioPlayer(require("../assets/sounds/complete.mp3"));

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    });
  }, []);

  useEffect(() => {
    if (!justCompleted || !settings.soundEnabled) {
      return;
    }

    if (AppState.currentState !== "active") {
      return;
    }

    try {
      player.seekTo(0);
      player.volume = 0.8;
      player.play();
    } catch {
      // Audio playback is best-effort; never block the timer flow.
    }
  }, [justCompleted, player, settings.soundEnabled]);
};
