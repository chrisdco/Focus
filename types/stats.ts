import type { TimerMode } from "./timer";

export interface SessionLog {
  id: string;
  mode: TimerMode;
  durationMs: number;
  completedAt: number;
  taskId?: string;
}

export interface Stats {
  totalFocusSessions: number;
  totalFocusMinutes: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

export const createInitialStats = (): Stats => ({
  totalFocusSessions: 0,
  totalFocusMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
});
