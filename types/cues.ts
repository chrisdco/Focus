export type CompletionSoundId =
  | "classic"
  | "chime"
  | "ping"
  | "bell"
  | "wood";

export type BreakSoundId = "soft" | "air";

export const COMPLETION_SOUND_IDS: CompletionSoundId[] = [
  "classic",
  "chime",
  "ping",
  "bell",
  "wood",
];

export const BREAK_SOUND_IDS: BreakSoundId[] = ["soft", "air"];

export const DEFAULT_COMPLETION_SOUND: CompletionSoundId = "classic";
export const DEFAULT_BREAK_SOUND: BreakSoundId = "soft";

export const isCompletionSoundId = (
  value: string | undefined
): value is CompletionSoundId =>
  COMPLETION_SOUND_IDS.includes(value as CompletionSoundId);

export const isBreakSoundId = (
  value: string | undefined
): value is BreakSoundId => BREAK_SOUND_IDS.includes(value as BreakSoundId);
