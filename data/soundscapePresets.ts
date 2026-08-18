import type { SoundscapePreset } from "../types/soundscape";

export const SOUNDSCAPE_PRESETS: SoundscapePreset[] = [
  {
    id: "deep_focus",
    name: "Deep Focus",
    layers: [{ id: "whiteNoise", volume: 0.35 }],
  },
  {
    id: "coffee_shop",
    name: "Coffee Shop",
    layers: [{ id: "cafe", volume: 0.7 }],
  },
  {
    id: "nature",
    name: "Nature",
    layers: [
      { id: "rain", volume: 0.45 },
      { id: "forest", volume: 0.55 },
    ],
  },
];

export const DEFAULT_SOUND_MIX = SOUNDSCAPE_PRESETS[0].layers;
