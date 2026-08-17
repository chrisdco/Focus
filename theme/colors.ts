import type { TimerMode } from "../types/timer";

export const colors = {
  background: "#020617",
  surface: "#111827",
  text: "#F9FAFB",
  textSecondary: "#D1D5DB",
  textMuted: "#9CA3AF",
  border: "#4B5563",
  focus: "#4F46E5",
  shortBreak: "#10B981",
  longBreak: "#3B82F6",
} as const;

export const modeColors: Record<TimerMode, string> = {
  focus: colors.focus,
  shortBreak: colors.shortBreak,
  longBreak: colors.longBreak,
};

export const modeLabels: Record<TimerMode, string> = {
  focus: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};
