export type SoundscapeId =
  | "rain"
  | "cafe"
  | "forest"
  | "fireplace"
  | "whiteNoise";

export interface SoundMixLayer {
  id: SoundscapeId;
  volume: number;
}

export interface SoundscapeTrack {
  id: SoundscapeId;
  label: string;
  emoji: string;
  source: number;
}

export interface SoundscapePreset {
  id: string;
  name: string;
  layers: SoundMixLayer[];
}

export const MAX_MIX_LAYERS = 3;

export const SOUNDSCAPE_TRACKS: Record<SoundscapeId, SoundscapeTrack> = {
  rain: {
    id: "rain",
    label: "Rain",
    emoji: "🌧️",
    source: require("../assets/sounds/rain.wav"),
  },
  cafe: {
    id: "cafe",
    label: "Café",
    emoji: "☕",
    source: require("../assets/sounds/cafe.wav"),
  },
  forest: {
    id: "forest",
    label: "Forest",
    emoji: "🌲",
    source: require("../assets/sounds/forest.wav"),
  },
  fireplace: {
    id: "fireplace",
    label: "Fireplace",
    emoji: "🔥",
    source: require("../assets/sounds/fireplace.wav"),
  },
  whiteNoise: {
    id: "whiteNoise",
    label: "White noise",
    emoji: "🌊",
    source: require("../assets/sounds/white-noise.wav"),
  },
};

export const SOUNDSCAPE_IDS = Object.keys(
  SOUNDSCAPE_TRACKS
) as SoundscapeId[];
