import { describe, expect, it } from "vitest";

import type { Stats } from "../types/stats";
import { ACHIEVEMENTS, evaluateAchievements } from "./achievements";

const makeStats = (overrides: Partial<Stats> = {}): Stats => ({
  totalFocusSessions: 0,
  totalFocusMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  ...overrides,
});

describe("ACHIEVEMENTS", () => {
  it("has an evaluator check for every defined badge", () => {
    const ids = new Set(ACHIEVEMENTS.map((achievement) => achievement.id));

    const newly = evaluateAchievements(
      makeStats({
        totalFocusSessions: 1000,
        totalFocusMinutes: 10_000,
        currentStreak: 30,
        longestStreak: 30,
      }),
      50,
      8,
      new Set()
    );

    expect(newly.length).toBe(ids.size);
    expect(new Set(newly)).toEqual(ids);
  });
});

describe("evaluateAchievements", () => {
  it("unlocks nothing on empty stats", () => {
    expect(evaluateAchievements(makeStats(), 0, 8, new Set())).toEqual([]);
  });

  it("unlocks the first pomodoro at exactly one session", () => {
    expect(
      evaluateAchievements(makeStats({ totalFocusSessions: 1 }), 0, 8, new Set())
    ).toEqual(["first_pomodoro"]);
  });

  it("respects exact thresholds", () => {
    const stats = makeStats({
      totalFocusSessions: 10,
      currentStreak: 3,
      longestStreak: 3,
      totalFocusMinutes: 300,
    });

    expect(evaluateAchievements(stats, 0, 8, new Set()).sort()).toEqual([
      "first_pomodoro",
      "minutes_300",
      "sessions_10",
      "streak_3",
    ]);
  });

  it("requires a positive goal for the daily badge", () => {
    expect(evaluateAchievements(makeStats(), 5, 0, new Set())).toEqual([]);
    expect(evaluateAchievements(makeStats(), 4, 4, new Set())).toEqual([
      "daily_goal",
    ]);
    expect(evaluateAchievements(makeStats(), 3, 4, new Set())).toEqual([]);
  });

  it("skips already unlocked badges", () => {
    const stats = makeStats({
      totalFocusSessions: 1,
      totalFocusMinutes: 25,
      currentStreak: 1,
      longestStreak: 1,
    });

    const newly = evaluateAchievements(stats, 1, 1, new Set(["first_pomodoro"]));

    expect(newly).toEqual(["daily_goal"]);
  });
});
