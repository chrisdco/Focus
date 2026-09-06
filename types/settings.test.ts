import { describe, expect, it } from "vitest";

import type { SoundMixLayer } from "./soundscape";
import {
  normalizeAccentId,
  normalizeBreakSoundId,
  normalizeCompletionSoundId,
  normalizeSettings,
  normalizeSoundMix,
  normalizeTimerLayout,
  matchesTimerPreset,
  TIMER_PRESETS,
  DEFAULT_SETTINGS,
} from "./settings";
import { DEFAULT_ACCENT_ID } from "../theme/accents";

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

describe("personalization setting normalizers", () => {
  it("falls back to the default accent for unknown accents", () => {
    expect(normalizeAccentId("not-a-color")).toBe(DEFAULT_ACCENT_ID);
    expect(normalizeAccentId("rose")).toBe("rose");
  });

  it("only allows standard or minimal layouts", () => {
    expect(normalizeTimerLayout("minimal")).toBe("minimal");
    expect(normalizeTimerLayout("wide")).toBe("standard");
  });

  it("falls back to default cue ids", () => {
    expect(normalizeCompletionSoundId("wood")).toBe("wood");
    expect(normalizeCompletionSoundId("laser")).toBe("classic");
    expect(normalizeBreakSoundId("air")).toBe("air");
    expect(normalizeBreakSoundId("honk")).toBe("soft");
  });
});

describe("normalizeSettings", () => {
  it("clamps numeric fields into valid ranges", () => {
    const result = normalizeSettings({
      focusDurationMinutes: 999,
      shortBreakDurationMinutes: -5,
      sessionsBeforeLongBreak: 99,
      dailyPomodoroGoal: 0,
    });

    expect(result.focusDurationMinutes).toBe(180);
    expect(result.shortBreakDurationMinutes).toBe(1);
    expect(result.sessionsBeforeLongBreak).toBe(8);
    expect(result.dailyPomodoroGoal).toBe(1);
  });

  it("falls back for non-numeric input", () => {
    const result = normalizeSettings({
      focusDurationMinutes: "x" as unknown as number,
    });

    expect(result.focusDurationMinutes).toBe(
      DEFAULT_SETTINGS.focusDurationMinutes
    );
  });

  it("defaults strict mode off and coerces truthy input", () => {
    expect(normalizeSettings({}).strictMode).toBe(false);
    expect(normalizeSettings({ strictMode: true }).strictMode).toBe(true);
    expect(
      normalizeSettings({ strictMode: "yes" as unknown as boolean }).strictMode
    ).toBe(false);
  });
});

describe("timer presets", () => {
  it("ships valid recipes with positive durations", () => {
    expect(TIMER_PRESETS.length).toBeGreaterThan(0);
    for (const preset of TIMER_PRESETS) {
      expect(preset.focusDurationMinutes).toBeGreaterThan(0);
      expect(preset.shortBreakDurationMinutes).toBeGreaterThan(0);
      expect(preset.longBreakDurationMinutes).toBeGreaterThan(0);
      expect(preset.sessionsBeforeLongBreak).toBeGreaterThanOrEqual(2);
    }
  });

  it("matches the classic defaults", () => {
    const classic = TIMER_PRESETS.find((preset) => preset.id === "classic");
    if (!classic) {
      throw new Error("classic preset missing");
    }
    expect(matchesTimerPreset(DEFAULT_SETTINGS, classic)).toBe(true);
    expect(
      matchesTimerPreset({ ...DEFAULT_SETTINGS, focusDurationMinutes: 50 }, classic)
    ).toBe(false);
  });
});
