import type { BreakSoundId, CompletionSoundId } from "../types/cues";

export interface CueOption<T extends string> {
  id: T;
  label: string;
  source: number;
}

export const COMPLETION_SOUNDS: CueOption<CompletionSoundId>[] = [
  {
    id: "classic",
    label: "Classic",
    source: require("../assets/sounds/complete.mp3"),
  },
  {
    id: "chime",
    label: "Chime",
    source: require("../assets/sounds/cue-chime.wav"),
  },
  {
    id: "ping",
    label: "Ping",
    source: require("../assets/sounds/cue-ping.wav"),
  },
  {
    id: "bell",
    label: "Bell",
    source: require("../assets/sounds/cue-bell.wav"),
  },
  {
    id: "wood",
    label: "Wood",
    source: require("../assets/sounds/cue-wood.wav"),
  },
];

export const BREAK_SOUNDS: CueOption<BreakSoundId>[] = [
  {
    id: "soft",
    label: "Soft",
    source: require("../assets/sounds/cue-break-soft.wav"),
  },
  {
    id: "air",
    label: "Air",
    source: require("../assets/sounds/cue-break-air.wav"),
  },
];

export const getCompletionSource = (id: CompletionSoundId): number =>
  COMPLETION_SOUNDS.find((option) => option.id === id)?.source ??
  COMPLETION_SOUNDS[0].source;

export const getBreakSource = (id: BreakSoundId): number =>
  BREAK_SOUNDS.find((option) => option.id === id)?.source ??
  BREAK_SOUNDS[0].source;
