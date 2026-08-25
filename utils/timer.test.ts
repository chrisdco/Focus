import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "../types/settings";
import type { Settings } from "../types/settings";
import type { TimerSnapshot } from "../types/timer";
import {
  createInitialTimerState,
  formatDurationLabel,
  formatTime,
  getDaysBetween,
  hydrateFromSnapshot,
  toDateKey,
} from "./timer";

describe("formatTime", () => {
  it("formats milliseconds as MM:SS", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(1_000)).toBe("00:01");
    expect(formatTime(61_000)).toBe("01:01");
    expect(formatTime(3_661_000)).toBe("61:01");
  });

  it("clamps negative values to zero", () => {
    expect(formatTime(-5_000)).toBe("00:00");
  });
});

describe("formatDurationLabel", () => {
  it("renders a minutes label", () => {
    expect(formatDurationLabel(25 * 60 * 1000)).toBe("25:00");
    expect(formatDurationLabel(0)).toBe("0:00");
  });
});

describe("toDateKey", () => {
  it("pads month and day", () => {
    expect(toDateKey(new Date(2026, 0, 5).getTime())).toBe("2026-01-05");
    expect(toDateKey(new Date(2026, 10, 25).getTime())).toBe("2026-11-25");
  });
});

describe("getDaysBetween", () => {
  it("counts whole days forward and backward", () => {
    expect(getDaysBetween("2026-01-01", "2026-01-08")).toBe(7);
    expect(getDaysBetween("2026-01-08", "2026-01-01")).toBe(-7);
    expect(getDaysBetween("2026-03-05", "2026-03-05")).toBe(0);
  });

  it("handles month boundaries", () => {
    expect(getDaysBetween("2026-01-31", "2026-02-01")).toBe(1);
  });
});

describe("createInitialTimerState", () => {
  it("starts paused on focus with the configured duration", () => {
    const state = createInitialTimerState();

    expect(state).toEqual({
      isRunning: false,
      durationMs: DEFAULT_SETTINGS.focusDurationMinutes * 60_000,
      remainingMs: DEFAULT_SETTINGS.focusDurationMinutes * 60_000,
      expectedEndTime: null,
      mode: "focus",
      completedFocusSessions: 0,
    });
  });

  it("applies custom durations", () => {
    const settings: Settings = { ...DEFAULT_SETTINGS, focusDurationMinutes: 40 };
    const state = createInitialTimerState(settings);

    expect(state.durationMs).toBe(2_400_000);
    expect(state.remainingMs).toBe(2_400_000);
  });
});

const baseState = createInitialTimerState();

describe("hydrateFromSnapshot", () => {
  it("restores a paused snapshot as-is", () => {
    const snapshot: TimerSnapshot = {
      isRunning: false,
      durationMs: 5 * 60_000,
      remainingMs: 3 * 60_000,
      expectedEndTime: null,
      mode: "shortBreak",
      completedFocusSessions: 2,
    };

    const result = hydrateFromSnapshot(baseState, snapshot, 1_000);

    expect(result).toEqual({ ...baseState, ...snapshot });
  });

  it("keeps a running snapshot going with recomputed remaining time", () => {
    const snapshot: TimerSnapshot = {
      isRunning: true,
      durationMs: 25 * 60_000,
      remainingMs: 20 * 60_000,
      expectedEndTime: 60_000,
      mode: "focus",
      completedFocusSessions: 1,
    };

    const result = hydrateFromSnapshot(baseState, snapshot, 10_000);

    expect(result.isRunning).toBe(true);
    expect(result.remainingMs).toBe(50_000);
    expect(result.expectedEndTime).toBe(60_000);
  });

  it("expires a running snapshot whose end time has passed", () => {
    const snapshot: TimerSnapshot = {
      isRunning: true,
      durationMs: 25 * 60_000,
      remainingMs: 1,
      expectedEndTime: 500,
      mode: "focus",
      completedFocusSessions: 0,
    };

    const result = hydrateFromSnapshot(baseState, snapshot, 1_000);

    expect(result.isRunning).toBe(false);
    expect(result.remainingMs).toBe(0);
    expect(result.expectedEndTime).toBeNull();
  });
});
