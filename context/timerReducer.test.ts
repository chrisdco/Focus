import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "../types/settings";
import type { TimerState } from "../types/timer";
import { createInitialTimerState } from "../utils/timer";
import { timerReducer, toTimerSnapshot } from "./TimerContext";

const base: TimerState = createInitialTimerState();

describe("START", () => {
  it("starts with the full duration when idle", () => {
    const result = timerReducer(base, { type: "START", now: 1_000 });

    expect(result.isRunning).toBe(true);
    expect(result.remainingMs).toBe(base.durationMs);
    expect(result.expectedEndTime).toBe(1_000 + base.durationMs);
  });

  it("resumes from remaining time after a pause", () => {
    const paused: TimerState = { ...base, remainingMs: 10_000 };
    const result = timerReducer(paused, { type: "START", now: 5_000 });

    expect(result.isRunning).toBe(true);
    expect(result.remainingMs).toBe(10_000);
    expect(result.expectedEndTime).toBe(15_000);
  });

  it("restarts with the full duration when remaining is zero", () => {
    const finished: TimerState = { ...base, remainingMs: 0 };
    const result = timerReducer(finished, { type: "START", now: 1_000 });

    expect(result.isRunning).toBe(true);
    expect(result.remainingMs).toBe(base.durationMs);
  });

  it("is a no-op while already running", () => {
    const running = timerReducer(base, { type: "START", now: 1_000 });
    expect(timerReducer(running, { type: "START", now: 2_000 })).toBe(running);
  });
});

describe("PAUSE", () => {
  it("freezes the remaining time from the expected end", () => {
    const running = timerReducer(base, { type: "START", now: 0 });
    const result = timerReducer(running, { type: "PAUSE", now: 4_000 });

    expect(result.isRunning).toBe(false);
    expect(result.remainingMs).toBe(running.durationMs - 4_000);
    expect(result.expectedEndTime).toBeNull();
  });

  it("is a no-op when not running", () => {
    expect(timerReducer(base, { type: "PAUSE", now: 100 })).toBe(base);
  });
});

describe("TICK", () => {
  it("decrements based on wall-clock time", () => {
    const running = timerReducer(base, { type: "START", now: 0 });
    const result = timerReducer(running, { type: "TICK", now: 3_000 });

    expect(result.remainingMs).toBe(running.durationMs - 3_000);
    expect(result.isRunning).toBe(true);
  });

  it("stops and clamps at zero when expired", () => {
    const running = timerReducer(base, { type: "START", now: 0 });
    const result = timerReducer(running, { type: "TICK", now: 10 ** 9 });

    expect(result.isRunning).toBe(false);
    expect(result.remainingMs).toBe(0);
    expect(result.expectedEndTime).toBeNull();
  });

  it("returns the same state when nothing changed", () => {
    const running = timerReducer(base, { type: "START", now: 0 });
    const ticked = timerReducer(running, { type: "TICK", now: 1_000 });

    expect(timerReducer(ticked, { type: "TICK", now: 1_000 })).toBe(ticked);
  });

  it("is a no-op when paused", () => {
    expect(timerReducer(base, { type: "TICK", now: 1_000 })).toBe(base);
  });
});

describe("COMPLETE_SESSION", () => {
  it("advances focus to short break and counts the session", () => {
    const state: TimerState = { ...base, completedFocusSessions: 0 };
    const result = timerReducer(state, {
      type: "COMPLETE_SESSION",
      now: 1_000,
      nextDurationMs: DEFAULT_SETTINGS.shortBreakDurationMinutes * 60_000,
      sessionsBeforeLongBreak: 4,
    });

    expect(result.mode).toBe("shortBreak");
    expect(result.completedFocusSessions).toBe(1);
    expect(result.isRunning).toBe(false);
    expect(result.expectedEndTime).toBeNull();
    expect(result.remainingMs).toBe(
      DEFAULT_SETTINGS.shortBreakDurationMinutes * 60_000
    );
  });

  it("advances to long break at the threshold", () => {
    const state: TimerState = { ...base, completedFocusSessions: 3 };
    const result = timerReducer(state, {
      type: "COMPLETE_SESSION",
      now: 1_000,
      nextDurationMs: DEFAULT_SETTINGS.longBreakDurationMinutes * 60_000,
      sessionsBeforeLongBreak: 4,
    });

    expect(result.mode).toBe("longBreak");
    expect(result.completedFocusSessions).toBe(4);
  });

  it("resets the session counter after a long break", () => {
    const state: TimerState = {
      ...base,
      mode: "longBreak",
      completedFocusSessions: 4,
    };
    const result = timerReducer(state, {
      type: "COMPLETE_SESSION",
      now: 1_000,
      nextDurationMs: base.durationMs,
      sessionsBeforeLongBreak: 4,
    });

    expect(result.mode).toBe("focus");
    expect(result.completedFocusSessions).toBe(0);
    expect(result.durationMs).toBe(base.durationMs);
  });
});

describe("SKIP", () => {
  it("applies the requested next session verbatim", () => {
    const state: TimerState = { ...base, isRunning: true };
    const result = timerReducer(state, {
      type: "SKIP",
      nextMode: "shortBreak",
      nextDurationMs: 300_000,
      completedFocusSessions: 2,
    });

    expect(result).toEqual({
      ...state,
      isRunning: false,
      mode: "shortBreak",
      completedFocusSessions: 2,
      durationMs: 300_000,
      remainingMs: 300_000,
      expectedEndTime: null,
    });
  });
});

describe("RESET", () => {
  it("resets timing but preserves mode and session counter", () => {
    const dirty: TimerState = {
      ...base,
      isRunning: true,
      mode: "shortBreak",
      completedFocusSessions: 3,
      remainingMs: 42,
      expectedEndTime: 99,
    };
    const result = timerReducer(dirty, { type: "RESET", durationMs: 600_000 });

    expect(result).toEqual({
      isRunning: false,
      durationMs: 600_000,
      remainingMs: 600_000,
      expectedEndTime: null,
      mode: "shortBreak",
      completedFocusSessions: 3,
    });
  });
});

describe("toTimerSnapshot", () => {
  it("projects only the persistable fields", () => {
    const state: TimerState = {
      isRunning: true,
      durationMs: 25 * 60_000,
      remainingMs: 12 * 60_000,
      expectedEndTime: 555,
      mode: "focus",
      completedFocusSessions: 3,
    };

    expect(toTimerSnapshot(state)).toEqual({
      isRunning: true,
      durationMs: 25 * 60_000,
      remainingMs: 12 * 60_000,
      expectedEndTime: 555,
      mode: "focus",
      completedFocusSessions: 3,
    });
  });
});
