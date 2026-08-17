export interface Settings {
  focusDurationMinutes: number;
  shortBreakDurationMinutes: number;
  longBreakDurationMinutes: number;
  sessionsBeforeLongBreak: number;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  notificationsEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  focusDurationMinutes: 25,
  shortBreakDurationMinutes: 5,
  longBreakDurationMinutes: 15,
  sessionsBeforeLongBreak: 4,
  hapticsEnabled: true,
  soundEnabled: false,
  darkMode: true,
  notificationsEnabled: true,
};
