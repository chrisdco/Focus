import type { TimerMode } from "../types/timer";

export interface ColorPalette {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  focus: string;
  shortBreak: string;
  longBreak: string;
  track: string;
  danger: string;
  /** Text/icons on accent-colored buttons */
  onPrimary: string;
  /** Modal/celebration scrim */
  overlay: string;
}

export const darkColors: ColorPalette = {
  background: "#020617",
  surface: "#111827",
  text: "#F9FAFB",
  textSecondary: "#D1D5DB",
  textMuted: "#9CA3AF",
  border: "#4B5563",
  focus: "#4F46E5",
  shortBreak: "#10B981",
  longBreak: "#3B82F6",
  track: "#1F2937",
  danger: "#EF4444",
  onPrimary: "#FFFFFF",
  overlay: "rgba(2, 6, 23, 0.78)",
};

export const lightColors: ColorPalette = {
  background: "#F9FAFB",
  surface: "#FFFFFF",
  text: "#111827",
  textSecondary: "#374151",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  focus: "#4F46E5",
  shortBreak: "#059669",
  longBreak: "#2563EB",
  track: "#E5E7EB",
  danger: "#DC2626",
  onPrimary: "#FFFFFF",
  overlay: "rgba(17, 24, 39, 0.42)",
};

export const getModeColors = (
  palette: ColorPalette
): Record<TimerMode, string> => ({
  focus: palette.focus,
  shortBreak: palette.shortBreak,
  longBreak: palette.longBreak,
});

export const modeLabels: Record<TimerMode, string> = {
  focus: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};
