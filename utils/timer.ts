import type { Settings } from "../types/settings";
import { DEFAULT_SETTINGS } from "../types/settings";
import type { TimerState } from "../types/timer";

import { getDurationForMode } from "../domain/timerMachine";

export const createInitialTimerState = (
  settings: Settings = DEFAULT_SETTINGS
): TimerState => {
  const durationMs = getDurationForMode("focus", settings);

  return {
    isRunning: false,
    durationMs,
    remainingMs: durationMs,
    expectedEndTime: null,
    mode: "focus",
    completedFocusSessions: 0,
  };
};

/**
 * Format milliseconds into MM:SS for display.
 */
export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  return `${paddedMinutes}:${paddedSeconds}`;
};

export const formatDurationLabel = (durationMs: number): string => {
  const totalMinutes = Math.round(durationMs / 60000);
  return `${totalMinutes}:00`;
};

export const toDateKey = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getDaysBetween = (from: string, to: string): number => {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  const diffMs = toDate.getTime() - fromDate.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
};
