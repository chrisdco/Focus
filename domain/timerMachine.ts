import type { Settings } from "../types/settings";
import { DEFAULT_SETTINGS } from "../types/settings";
import type { TimerMode } from "../types/timer";

export const FOCUS_SESSIONS_BEFORE_LONG_BREAK = 4;

export const minutesToMs = (minutes: number): number => minutes * 60 * 1000;

export const getDurationForMode = (
  mode: TimerMode,
  settings: Settings = DEFAULT_SETTINGS
): number => {
  switch (mode) {
    case "focus":
      return minutesToMs(settings.focusDurationMinutes);
    case "shortBreak":
      return minutesToMs(settings.shortBreakDurationMinutes);
    case "longBreak":
      return minutesToMs(settings.longBreakDurationMinutes);
  }
};

export const getNextMode = (
  currentMode: TimerMode,
  completedFocusSessions: number,
  sessionsBeforeLongBreak: number = FOCUS_SESSIONS_BEFORE_LONG_BREAK
): TimerMode => {
  if (currentMode === "focus") {
    return completedFocusSessions >= sessionsBeforeLongBreak
      ? "longBreak"
      : "shortBreak";
  }

  return "focus";
};

export const getCurrentSessionNumber = (
  completedFocusSessions: number,
  sessionsBeforeLongBreak: number = FOCUS_SESSIONS_BEFORE_LONG_BREAK
): number => {
  return Math.min(completedFocusSessions + 1, sessionsBeforeLongBreak);
};
