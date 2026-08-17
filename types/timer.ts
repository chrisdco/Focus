export type TimerMode = "focus" | "shortBreak" | "longBreak";

export interface TimerState {
  isRunning: boolean;
  durationMs: number;
  remainingMs: number;
  expectedEndTime: number | null;
  mode: TimerMode;
  completedFocusSessions: number;
}

export type TimerAction =
  | { type: "START"; now: number }
  | { type: "PAUSE"; now: number }
  | { type: "RESET"; durationMs: number }
  | { type: "TICK"; now: number }
  | {
      type: "COMPLETE_SESSION";
      now: number;
      nextDurationMs: number;
      sessionsBeforeLongBreak: number;
    }
  | { type: "SWITCH_MODE"; mode: TimerMode; durationMs: number }
  | {
      type: "SKIP";
      nextMode: TimerMode;
      nextDurationMs: number;
      completedFocusSessions: number;
    }
  | { type: "HYDRATE"; snapshot: TimerSnapshot };

export interface TimerSnapshot {
  isRunning: boolean;
  durationMs: number;
  remainingMs: number;
  expectedEndTime: number | null;
  mode: TimerMode;
  completedFocusSessions: number;
}
