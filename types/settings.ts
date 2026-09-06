import {
  DEFAULT_ACCENT_ID,
  isAccentId,
  type AccentId,
} from "../theme/accents";
import {
  DEFAULT_BREAK_SOUND,
  DEFAULT_COMPLETION_SOUND,
  isBreakSoundId,
  isCompletionSoundId,
  type BreakSoundId,
  type CompletionSoundId,
} from "./cues";
import type { SoundMixLayer, SoundscapeId } from "./soundscape";

export type TimerLayout = "standard" | "minimal";

export interface Settings {
  focusDurationMinutes: number;
  shortBreakDurationMinutes: number;
  longBreakDurationMinutes: number;
  sessionsBeforeLongBreak: number;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  notificationsEnabled: boolean;
  autoStartNextSession: boolean;
  autoEnterFocusMode: boolean;
  strictMode: boolean;
  dailyPomodoroGoal: number;
  ambientSoundEnabled: boolean;
  autoPlaySoundscape: boolean;
  continueSoundscapeOnBreak: boolean;
  focusAnimationsEnabled: boolean;
  soundMix: SoundMixLayer[];
  activeSoundscapePresetId: string | null;
  accentId: AccentId;
  timerLayout: TimerLayout;
  completionSoundId: CompletionSoundId;
  breakSoundId: BreakSoundId;
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
  autoStartNextSession: false,
  autoEnterFocusMode: true,
  strictMode: false,
  dailyPomodoroGoal: 8,
  ambientSoundEnabled: true,
  autoPlaySoundscape: true,
  continueSoundscapeOnBreak: false,
  focusAnimationsEnabled: true,
  soundMix: [{ id: "whiteNoise", volume: 0.35 }],
  activeSoundscapePresetId: "deep_focus",
  accentId: DEFAULT_ACCENT_ID,
  timerLayout: "standard",
  completionSoundId: DEFAULT_COMPLETION_SOUND,
  breakSoundId: DEFAULT_BREAK_SOUND,
};

export const normalizeSoundMix = (mix: SoundMixLayer[]): SoundMixLayer[] => {
  const seen = new Set<SoundscapeId>();
  const normalized: SoundMixLayer[] = [];

  for (const layer of mix) {
    if (seen.has(layer.id) || normalized.length >= 3) {
      continue;
    }

    seen.add(layer.id);
    normalized.push({
      id: layer.id,
      volume: Math.max(0, Math.min(1, layer.volume)),
    });
  }

  return normalized;
};

export const normalizeTimerLayout = (value: unknown): TimerLayout =>
  value === "minimal" ? "minimal" : "standard";

export const normalizeAccentId = (value: unknown): AccentId =>
  typeof value === "string" && isAccentId(value) ? value : DEFAULT_ACCENT_ID;

export const normalizeCompletionSoundId = (
  value: unknown
): CompletionSoundId =>
  typeof value === "string" && isCompletionSoundId(value)
    ? value
    : DEFAULT_COMPLETION_SOUND;

export const normalizeBreakSoundId = (value: unknown): BreakSoundId =>
  typeof value === "string" && isBreakSoundId(value)
    ? value
    : DEFAULT_BREAK_SOUND;

const clampInt = (
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number => {
  const n = typeof value === "number" ? Math.round(value) : NaN;
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, n));
};

const normalizeBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

export const normalizeSettings = (stored: Partial<Settings>): Settings => ({
  ...DEFAULT_SETTINGS,
  ...stored,
  // Legacy key from before the timer-preset rename; migrate silently.
  activeSoundscapePresetId:
    typeof stored.activeSoundscapePresetId === "string"
      ? stored.activeSoundscapePresetId
      : typeof (stored as Record<string, unknown>).activePresetId === "string"
        ? ((stored as Record<string, unknown>).activePresetId as string)
        : DEFAULT_SETTINGS.activeSoundscapePresetId,
  // Booleans coerce strictly: corrupt payloads (strings, numbers) fall
  // back instead of flipping a toggle.
  hapticsEnabled: normalizeBoolean(
    stored.hapticsEnabled,
    DEFAULT_SETTINGS.hapticsEnabled
  ),
  soundEnabled: normalizeBoolean(
    stored.soundEnabled,
    DEFAULT_SETTINGS.soundEnabled
  ),
  darkMode: normalizeBoolean(stored.darkMode, DEFAULT_SETTINGS.darkMode),
  notificationsEnabled: normalizeBoolean(
    stored.notificationsEnabled,
    DEFAULT_SETTINGS.notificationsEnabled
  ),
  autoStartNextSession: normalizeBoolean(
    stored.autoStartNextSession,
    DEFAULT_SETTINGS.autoStartNextSession
  ),
  autoEnterFocusMode: normalizeBoolean(
    stored.autoEnterFocusMode,
    DEFAULT_SETTINGS.autoEnterFocusMode
  ),
  ambientSoundEnabled: normalizeBoolean(
    stored.ambientSoundEnabled,
    DEFAULT_SETTINGS.ambientSoundEnabled
  ),
  autoPlaySoundscape: normalizeBoolean(
    stored.autoPlaySoundscape,
    DEFAULT_SETTINGS.autoPlaySoundscape
  ),
  continueSoundscapeOnBreak: normalizeBoolean(
    stored.continueSoundscapeOnBreak,
    DEFAULT_SETTINGS.continueSoundscapeOnBreak
  ),
  focusAnimationsEnabled: normalizeBoolean(
    stored.focusAnimationsEnabled,
    DEFAULT_SETTINGS.focusAnimationsEnabled
  ),
  focusDurationMinutes: clampInt(
    stored.focusDurationMinutes,
    1,
    180,
    DEFAULT_SETTINGS.focusDurationMinutes
  ),
  shortBreakDurationMinutes: clampInt(
    stored.shortBreakDurationMinutes,
    1,
    60,
    DEFAULT_SETTINGS.shortBreakDurationMinutes
  ),
  longBreakDurationMinutes: clampInt(
    stored.longBreakDurationMinutes,
    1,
    60,
    DEFAULT_SETTINGS.longBreakDurationMinutes
  ),
  sessionsBeforeLongBreak: clampInt(
    stored.sessionsBeforeLongBreak,
    2,
    8,
    DEFAULT_SETTINGS.sessionsBeforeLongBreak
  ),
  dailyPomodoroGoal: clampInt(
    stored.dailyPomodoroGoal,
    1,
    50,
    DEFAULT_SETTINGS.dailyPomodoroGoal
  ),
  soundMix: normalizeSoundMix(stored.soundMix ?? DEFAULT_SETTINGS.soundMix),
  accentId: normalizeAccentId(stored.accentId),
  timerLayout: normalizeTimerLayout(stored.timerLayout),
  completionSoundId: normalizeCompletionSoundId(stored.completionSoundId),
  breakSoundId: normalizeBreakSoundId(stored.breakSoundId),
  strictMode: normalizeBoolean(
    stored.strictMode,
    DEFAULT_SETTINGS.strictMode
  ),
});

export interface TimerPreset {
  id: string;
  label: string;
  summary: string;
  focusDurationMinutes: number;
  shortBreakDurationMinutes: number;
  longBreakDurationMinutes: number;
  sessionsBeforeLongBreak: number;
}

export const TIMER_PRESETS: TimerPreset[] = [
  {
    id: "classic",
    label: "Classic",
    summary: "25 / 5",
    focusDurationMinutes: 25,
    shortBreakDurationMinutes: 5,
    longBreakDurationMinutes: 15,
    sessionsBeforeLongBreak: 4,
  },
  {
    id: "deep",
    label: "Deep work",
    summary: "50 / 10",
    focusDurationMinutes: 50,
    shortBreakDurationMinutes: 10,
    longBreakDurationMinutes: 20,
    sessionsBeforeLongBreak: 3,
  },
  {
    id: "sprint",
    label: "Sprint",
    summary: "15 / 3",
    focusDurationMinutes: 15,
    shortBreakDurationMinutes: 3,
    longBreakDurationMinutes: 10,
    sessionsBeforeLongBreak: 4,
  },
];

export const matchesTimerPreset = (
  settings: Pick<
    Settings,
    | "focusDurationMinutes"
    | "shortBreakDurationMinutes"
    | "longBreakDurationMinutes"
    | "sessionsBeforeLongBreak"
  >,
  preset: TimerPreset
): boolean =>
  settings.focusDurationMinutes === preset.focusDurationMinutes &&
  settings.shortBreakDurationMinutes === preset.shortBreakDurationMinutes &&
  settings.longBreakDurationMinutes === preset.longBreakDurationMinutes &&
  settings.sessionsBeforeLongBreak === preset.sessionsBeforeLongBreak;
