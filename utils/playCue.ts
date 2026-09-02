import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

export const playCue = async (source: number): Promise<void> => {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    });

    const player = createAudioPlayer(source);
    player.volume = 0.85;
    player.play();

    setTimeout(() => {
      try {
        player.release();
      } catch {
        // Release is best-effort after playback.
      }
    }, 2500);
  } catch {
    // Cue playback must never block the timer.
  }
};
