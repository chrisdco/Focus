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
  dailyPomodoroGoal: number;
  ambientSoundEnabled: boolean;
  autoPlaySoundscape: boolean;
  continueSoundscapeOnBreak: boolean;
  focusAnimationsEnabled: boolean;
  soundMix: SoundMixLayer[];
  activePresetId: string | null;
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
  dailyPomodoroGoal: 8,
  ambientSoundEnabled: true,
  autoPlaySoundscape: true,
  continueSoundscapeOnBreak: false,
  focusAnimationsEnabled: true,
  soundMix: [{ id: "whiteNoise", volume: 0.35 }],
  activePresetId: "deep_focus",
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

export const normalizeSettings = (stored: Partial<Settings>): Settings => ({
  ...DEFAULT_SETTINGS,
  ...stored,
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
});
