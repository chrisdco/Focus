import { describe, expect, it } from "vitest";

import type { SoundMixLayer } from "./soundscape";
import { normalizeSoundMix } from "./settings";

const layer = (id: SoundMixLayer["id"], volume: number): SoundMixLayer => ({
  id,
  volume,
});

describe("normalizeSoundMix", () => {
  it("clamps volumes into [0, 1]", () => {
    expect(normalizeSoundMix([layer("rain", 1.7)])).toEqual([
      { id: "rain", volume: 1 },
    ]);
    expect(normalizeSoundMix([layer("rain", -0.5)])).toEqual([
      { id: "rain", volume: 0 },
    ]);
  });

  it("drops duplicate ids keeping the first occurrence", () => {
    expect(
      normalizeSoundMix([
        layer("rain", 0.2),
        layer("cafe", 0.3),
        layer("rain", 0.9),
      ])
    ).toEqual([
      { id: "rain", volume: 0.2 },
      { id: "cafe", volume: 0.3 },
    ]);
  });

  it("caps the mix at three layers", () => {
    const mix = [
      layer("rain", 0.1),
      layer("cafe", 0.2),
      layer("forest", 0.3),
      layer("fireplace", 0.4),
      layer("whiteNoise", 0.5),
    ];

    const normalized = normalizeSoundMix(mix);

    expect(normalized.map((entry) => entry.id)).toEqual([
      "rain",
      "cafe",
      "forest",
    ]);
  });

  it("passes a valid mix through unchanged", () => {
    const mix = [layer("fireplace", 0.6), layer("whiteNoise", 0.35)];

    expect(normalizeSoundMix(mix)).toEqual(mix);
  });
});
