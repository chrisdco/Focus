import { useEffect, useRef, useState } from "react";

import { pickMessage } from "../data/personalityMessages";
import type { PersonalityTrigger } from "../data/personalityMessages";
import type { TimerMode } from "../types/timer";

interface UsePersonalityMessageOptions {
  mode: TimerMode;
  isRunning: boolean;
  remainingMs: number;
  durationMs: number;
  justCompleted: boolean;
}

export const usePersonalityMessage = ({
  mode,
  isRunning,
  remainingMs,
  durationMs,
  justCompleted,
}: UsePersonalityMessageOptions): string => {
  const [message, setMessage] = useState("");
  const midShownRef = useRef(false);
  const prevRunningRef = useRef(isRunning);
  const prevModeRef = useRef(mode);

  useEffect(() => {
    if (mode !== prevModeRef.current) {
      midShownRef.current = false;
      prevModeRef.current = mode;

      if (mode !== "focus") {
        const trigger: PersonalityTrigger = "breakStart";
        setMessage(pickMessage(mode, trigger));
      }
    }
  }, [mode]);

  useEffect(() => {
    if (isRunning && !prevRunningRef.current) {
      setMessage(pickMessage(mode, "start"));
      midShownRef.current = false;
    }

    prevRunningRef.current = isRunning;
  }, [isRunning, mode]);

  useEffect(() => {
    if (!isRunning || durationMs <= 0) {
      return;
    }

    const progress = 1 - remainingMs / durationMs;

    if (!midShownRef.current && progress >= 0.5 && progress < 0.55) {
      midShownRef.current = true;
      setMessage(pickMessage(mode, "mid"));
    }
  }, [remainingMs, durationMs, isRunning, mode]);

  useEffect(() => {
    if (justCompleted) {
      setMessage(pickMessage(mode, "complete"));
    }
  }, [justCompleted, mode]);

  return message;
};
