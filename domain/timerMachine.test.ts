import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "../types/settings";
import type { Settings } from "../types/settings";
import {
  FOCUS_SESSIONS_BEFORE_LONG_BREAK,
  getCurrentSessionNumber,
  getDurationForMode,
  getNextMode,
  minutesToMs,
} from "./timerMachine";

describe("minutesToMs", () => {
  it("converts minutes to milliseconds", () => {
    expect(minutesToMs(25)).toBe(1_500_000);
    expect(minutesToMs(0)).toBe(0);
  });
});

describe("getDurationForMode", () => {
  it("returns default durations for each mode", () => {
    expect(getDurationForMode("focus")).toBe(
      minutesToMs(DEFAULT_SETTINGS.focusDurationMinutes)
    );
    expect(getDurationForMode("shortBreak")).toBe(
      minutesToMs(DEFAULT_SETTINGS.shortBreakDurationMinutes)
    );
    expect(getDurationForMode("longBreak")).toBe(
      minutesToMs(DEFAULT_SETTINGS.longBreakDurationMinutes)
    );
  });

  it("respects custom settings", () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      focusDurationMinutes: 50,
      shortBreakDurationMinutes: 7,
      longBreakDurationMinutes: 21,
    };

    expect(getDurationForMode("focus", settings)).toBe(3_000_000);
    expect(getDurationForMode("shortBreak", settings)).toBe(420_000);
    expect(getDurationForMode("longBreak", settings)).toBe(1_260_000);
  });
});

describe("getNextMode", () => {
  it("goes from focus to short break below the threshold", () => {
    expect(getNextMode("focus", 0, 4)).toBe("shortBreak");
    expect(getNextMode("focus", 3, 4)).toBe("shortBreak");
  });

  it("goes from focus to long break at and above the threshold", () => {
    expect(getNextMode("focus", 4, 4)).toBe("longBreak");
    expect(getNextMode("focus", 6, 4)).toBe("longBreak");
  });

  it("always returns focus after a break", () => {
    expect(getNextMode("shortBreak", 2, 4)).toBe("focus");
    expect(getNextMode("longBreak", 4, 4)).toBe("focus");
  });

  it("defaults the threshold to four sessions", () => {
    expect(FOCUS_SESSIONS_BEFORE_LONG_BREAK).toBe(4);
    expect(getNextMode("focus", 3)).toBe("shortBreak");
    expect(getNextMode("focus", 4)).toBe("longBreak");
  });
});

describe("getCurrentSessionNumber", () => {
  it("counts the upcoming session", () => {
    expect(getCurrentSessionNumber(0)).toBe(1);
    expect(getCurrentSessionNumber(2, 4)).toBe(3);
  });

  it("clamps at sessionsBeforeLongBreak", () => {
    expect(getCurrentSessionNumber(4, 4)).toBe(4);
    expect(getCurrentSessionNumber(9, 4)).toBe(4);
  });
});
