import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

const MAX_CUE_MS = 15_000;

/** Play a short cue and release the player once done (never blocks timer). */
export const playCue = async (source: number): Promise<void> => {
  let player: ReturnType<typeof createAudioPlayer> | null = null;
  let poll: ReturnType<typeof setInterval> | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    if (poll !== null) {
      clearInterval(poll);
      poll = null;
    }
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (player !== null) {
      try {
        player.release();
      } catch {
        // Release is best-effort after playback.
      }
      player = null;
    }
  };

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    });

    player = createAudioPlayer(source);
    player.volume = 0.85;
    player.play();

    await new Promise<void>((resolve) => {
      const startedAt = Date.now();
      poll = setInterval(() => {
        try {
          if (
            player === null ||
            !player.playing ||
            Date.now() - startedAt > MAX_CUE_MS
          ) {
            cleanup();
            resolve();
          }
        } catch {
          cleanup();
          resolve();
        }
      }, 250);
      // Fallback: never hold a player longer than the cap.
      timeout = setTimeout(() => {
        cleanup();
        resolve();
      }, MAX_CUE_MS + 500);
    });
  } catch {
    cleanup();
    // Cue playback must never block the timer.
  }
};
