import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionLog } from "../types/stats";
import {
  formatPeriodDelta,
  getFocusActivityByDay,
  getFocusByTaskProject,
  getPeriodStats,
  getPersonalRecords,
  getProductivityByHour,
  getProductivityByWeekday,
  getRecentSessions,
  getTodayPomodoroCount,
} from "./statsCalculator";

const FOCUS_MS = 25 * 60_000;

const makeLog = (overrides: Partial<SessionLog> = {}): SessionLog => ({
  id: Math.random().toString(36).slice(2),
  mode: "focus",
  durationMs: FOCUS_MS,
  completedAt: Date.now(),
  ...overrides,
});

const localTime = (
  year: number,
  month: number,
  day: number,
  hour = 12
): number => new Date(year, month - 1, day, hour).getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 7, 25, 12, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("formatPeriodDelta", () => {
  it("handles empty periods", () => {
    expect(formatPeriodDelta(0, 0)).toBe("—");
    expect(formatPeriodDelta(5, 0)).toBe("+100%");
    expect(formatPeriodDelta(0, 5)).toBe("-100%");
  });

  it("formats positive and negative deltas with rounding", () => {
    expect(formatPeriodDelta(110, 100)).toBe("+10%");
    expect(formatPeriodDelta(90, 100)).toBe("-10%");
    expect(formatPeriodDelta(100, 100)).toBe("+0%");
    expect(formatPeriodDelta(105, 103)).toBe("+2%");
  });
});

describe("getTodayPomodoroCount", () => {
  it("counts only focus sessions completed today", () => {
    const logs: SessionLog[] = [
      makeLog({ completedAt: localTime(2026, 8, 25, 9) }),
      makeLog({ completedAt: localTime(2026, 8, 25, 11) }),
      makeLog({ mode: "shortBreak", completedAt: localTime(2026, 8, 25, 10) }),
      makeLog({ completedAt: localTime(2026, 8, 24, 9) }),
    ];

    expect(getTodayPomodoroCount(logs)).toBe(2);
    expect(getTodayPomodoroCount([])).toBe(0);
  });
});

describe("getPeriodStats", () => {
  it("splits current and previous day windows", () => {
    const logs: SessionLog[] = [
      makeLog({
        completedAt: localTime(2026, 8, 25, 9),
        durationMs: 30 * 60_000,
      }),
      makeLog({
        completedAt: localTime(2026, 8, 24, 9),
        durationMs: 20 * 60_000,
      }),
      makeLog({ completedAt: localTime(2026, 8, 20, 9) }),
    ];

    const stats = getPeriodStats(logs, "day");

    expect(stats.pomodoros).toBe(1);
    expect(stats.focusMinutes).toBe(30);
    expect(stats.previousPomodoros).toBe(1);
    expect(stats.previousFocusMinutes).toBe(20);
  });

  it("uses rolling seven-day week windows", () => {
    const logs: SessionLog[] = [
      makeLog({ completedAt: localTime(2026, 8, 25) }),
      makeLog({ completedAt: localTime(2026, 8, 20) }),
      makeLog({ completedAt: localTime(2026, 8, 18) }),
      makeLog({ completedAt: localTime(2026, 8, 11) }),
    ];

    const stats = getPeriodStats(logs, "week");

    expect(stats.pomodoros).toBe(2);
    expect(stats.previousPomodoros).toBe(1);
  });

  it("uses calendar month windows", () => {
    const logs: SessionLog[] = [
      makeLog({ completedAt: localTime(2026, 8, 1) }),
      makeLog({ completedAt: localTime(2026, 7, 20) }),
      makeLog({ completedAt: localTime(2026, 6, 20) }),
      makeLog({ completedAt: localTime(2026, 5, 10) }),
    ];

    const stats = getPeriodStats(logs, "month");

    expect(stats.pomodoros).toBe(1);
    expect(stats.focusMinutes).toBe(25);
    expect(stats.previousPomodoros).toBe(1);
  });
});

describe("getFocusActivityByDay", () => {
  it("returns one entry per day, oldest first, focus only", () => {
    const logs: SessionLog[] = [
      makeLog({ completedAt: localTime(2026, 8, 19) }),
      makeLog({ completedAt: localTime(2026, 8, 25, 9) }),
      makeLog({
        completedAt: localTime(2026, 8, 25, 10),
        durationMs: 15 * 60_000,
      }),
      makeLog({ mode: "shortBreak", completedAt: localTime(2026, 8, 24) }),
    ];

    const activity = getFocusActivityByDay(logs, 7);

    expect(activity).toHaveLength(7);
    expect(activity[0]).toEqual({
      dateKey: "2026-08-19",
      pomodoros: 1,
      focusMinutes: 25,
    });
    expect(activity[5].pomodoros).toBe(0);
    expect(activity[6]).toEqual({
      dateKey: "2026-08-25",
      pomodoros: 2,
      focusMinutes: 40,
    });
  });
});

describe("getPersonalRecords", () => {
  it("summarizes longest session, best day, and average", () => {
    const logs: SessionLog[] = [
      makeLog({ completedAt: localTime(2026, 8, 3), durationMs: 25 * 60_000 }),
      makeLog({
        completedAt: localTime(2026, 8, 4, 9),
        durationMs: 50 * 60_000,
      }),
      makeLog({
        completedAt: localTime(2026, 8, 4, 14),
        durationMs: 25 * 60_000,
      }),
      makeLog({ completedAt: localTime(2026, 8, 5), durationMs: 10 * 60_000 }),
      makeLog({ mode: "shortBreak", completedAt: localTime(2026, 8, 4, 12) }),
    ];

    const records = getPersonalRecords(logs);

    expect(records.longestSessionMinutes).toBe(50);
    expect(records.bestDayPomodoros).toBe(2);
    expect(records.bestDayDate).toBe("2026-08-04");
    expect(records.averageSessionMinutes).toBe(28);
  });

  it("returns zeros when there are no focus logs", () => {
    expect(getPersonalRecords([])).toEqual({
      longestSessionMinutes: 0,
      bestDayPomodoros: 0,
      bestDayDate: null,
      averageSessionMinutes: 0,
    });
  });
});

describe("getProductivityByHour", () => {
  it("buckets focus sessions by local hour", () => {
    const logs: SessionLog[] = [
      makeLog({ completedAt: localTime(2026, 8, 25, 9) }),
      makeLog({ completedAt: localTime(2026, 8, 25, 9) + 60_000 }),
      makeLog({ completedAt: localTime(2026, 8, 24, 22) }),
    ];

    const counts = getProductivityByHour(logs);

    expect(counts[9]).toBe(2);
    expect(counts[22]).toBe(1);
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(3);
  });
});

describe("getProductivityByWeekday", () => {
  it("maps Sunday to the last slot and Monday to the first", () => {
    // 2000-01-01 was a Saturday, 2024-01-01 was a Monday.
    const logs: SessionLog[] = [
      makeLog({ completedAt: localTime(2000, 1, 1) }),
      makeLog({ completedAt: localTime(2024, 1, 1) }),
      makeLog({ mode: "shortBreak", completedAt: localTime(2000, 1, 2) }),
    ];

    const counts = getProductivityByWeekday(logs);

    expect(counts[0]).toBe(1);
    expect(counts[5]).toBe(1);
    expect(counts[6]).toBe(0);
  });
});

describe("getFocusByTaskProject", () => {
  it("aggregates by project through task resolution and sorts desc", () => {
    const logs: SessionLog[] = [
      makeLog({ taskId: "task-a" }),
      makeLog({ taskId: "task-a", durationMs: 50 * 60_000 }),
      makeLog({ taskId: "task-b", durationMs: 25 * 60_000 }),
      makeLog({}),
    ];

    const resolveProject = (taskId: string) =>
      taskId === "task-a"
        ? { id: "proj-a", name: "Alpha" }
        : { id: "proj-b", name: "Beta" };

    const stats = getFocusByTaskProject(logs, resolveProject);

    expect(stats).toEqual([
      { projectId: "proj-a", label: "Alpha", focusMinutes: 75, pomodoros: 2 },
      { projectId: "proj-b", label: "Beta", focusMinutes: 25, pomodoros: 1 },
    ]);
  });

  it("falls back to unknown for unresolvable tasks", () => {
    const stats = getFocusByTaskProject(
      [makeLog({ taskId: "ghost" })],
      () => null
    );

    expect(stats).toEqual([
      {
        projectId: "unknown",
        label: "Unknown",
        focusMinutes: 25,
        pomodoros: 1,
      },
    ]);
  });
});

describe("getRecentSessions", () => {
  it("filters focus sessions, sorts newest first, and limits", () => {
    const logs: SessionLog[] = [
      makeLog({ completedAt: localTime(2026, 8, 1) }),
      makeLog({ completedAt: localTime(2026, 8, 3) }),
      makeLog({ completedAt: localTime(2026, 8, 2) }),
      makeLog({ mode: "shortBreak", completedAt: localTime(2026, 8, 4) }),
      makeLog({ completedAt: localTime(2026, 8, 5) }),
    ];

    const recent = getRecentSessions(logs, 2);

    expect(recent.map((log) => log.completedAt)).toEqual([
      localTime(2026, 8, 5),
      localTime(2026, 8, 3),
    ]);
  });
});
