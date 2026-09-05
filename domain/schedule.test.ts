import { describe, expect, it } from "vitest";

import type { ScheduleBlock } from "../types/schedule";
import type { Task } from "../types/task";
import {
  addMonths,
  blocksOverlap,
  countBlocksByDate,
  formatClock,
  getBlocksForDate,
  getMonthCells,
  getPlannedPomodoroCount,
  getPlannedTaskPomodoros,
  getScheduledPomodoros,
  hasOverlap,
  monthLabel,
  parseClock,
  pomodorosFromMinutes,
  reminderDate,
  shiftDateKey,
  yearMonthOf,
} from "./schedule";

const block = (
  overrides: Partial<ScheduleBlock> = {}
): ScheduleBlock => ({
  id: "a",
  dateKey: "2026-09-03",
  startMinutes: 9 * 60,
  durationMinutes: 25,
  kind: "focus",
  taskId: null,
  ...overrides,
});

describe("schedule helpers", () => {
  it("shifts a date key by whole days", () => {
    expect(shiftDateKey("2026-09-03", 1)).toBe("2026-09-04");
    expect(shiftDateKey("2026-09-01", -1)).toBe("2026-08-31");
  });

  it("formats and parses clock times", () => {
    expect(formatClock(9 * 60 + 5)).toBe("09:05");
    expect(parseClock(14, 30)).toBe(14 * 60 + 30);
  });

  it("sorts blocks for a day and ignores other days", () => {
    const blocks = [
      block({ id: "late", startMinutes: 15 * 60 }),
      block({ id: "other", dateKey: "2026-09-04" }),
      block({ id: "early", startMinutes: 8 * 60 }),
    ];

    expect(getBlocksForDate(blocks, "2026-09-03").map((item) => item.id)).toEqual(
      ["early", "late"]
    );
  });

  it("detects overlapping blocks on the same day", () => {
    expect(
      blocksOverlap(
        block({ startMinutes: 60, durationMinutes: 30 }),
        block({ startMinutes: 80, durationMinutes: 25 })
      )
    ).toBe(true);

    expect(
      blocksOverlap(
        block({ startMinutes: 60, durationMinutes: 30 }),
        block({ startMinutes: 90, durationMinutes: 25 })
      )
    ).toBe(false);
  });

  it("ignores the same id when checking overlaps", () => {
    const existing = [block({ id: "keep", startMinutes: 9 * 60 })];

    expect(
      hasOverlap(existing, {
        id: "keep",
        dateKey: "2026-09-03",
        startMinutes: 9 * 60,
        durationMinutes: 25,
      })
    ).toBe(false);

    expect(
      hasOverlap(existing, {
        id: "new",
        dateKey: "2026-09-03",
        startMinutes: 9 * 60 + 10,
        durationMinutes: 25,
      })
    ).toBe(true);
  });

  it("counts scheduled focus pomodoros from block length", () => {
    expect(pomodorosFromMinutes(25)).toBe(1);
    expect(pomodorosFromMinutes(50)).toBe(2);
    expect(pomodorosFromMinutes(50, 50)).toBe(1);

    const blocks = [
      block({ kind: "focus", durationMinutes: 50 }),
      block({ id: "b", kind: "shortBreak", durationMinutes: 5 }),
      block({ id: "c", kind: "focus", durationMinutes: 25, taskId: "1" }),
    ];

    // Task-linked blocks are excluded (counted via task estimates).
    expect(getScheduledPomodoros(blocks, "2026-09-03")).toBe(2);
  });

  it("counts remaining estimates for tasks due that day", () => {
    const tasks: Task[] = [
      {
        id: "1",
        title: "A",
        notes: "",
        projectId: "inbox",
        estimatedPomodoros: 4,
        completedPomodoros: 1,
        priority: "medium",
        dueDate: "2026-09-03",
        tags: [],
        status: "active",
        createdAt: 1,
        completedAt: null,
      },
      {
        id: "2",
        title: "B",
        notes: "",
        projectId: "inbox",
        estimatedPomodoros: 2,
        completedPomodoros: 0,
        priority: "medium",
        dueDate: "2026-09-04",
        tags: [],
        status: "active",
        createdAt: 2,
        completedAt: null,
      },
    ];

    expect(getPlannedTaskPomodoros(tasks, "2026-09-03")).toBe(3);
    expect(getPlannedPomodoroCount(tasks, [block({ durationMinutes: 25 })], "2026-09-03")).toBe(4);
  });

  it("computes reminder time 5 minutes before the block", () => {
    const when = reminderDate(
      block({ dateKey: "2026-09-03", startMinutes: 9 * 60 })
    );

    expect(when.getHours()).toBe(8);
    expect(when.getMinutes()).toBe(55);
  });

  it("labels months and navigates across year boundaries", () => {
    expect(monthLabel(2026, 8)).toBe("September 2026");
    expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(yearMonthOf("2026-09-03")).toEqual({ year: 2026, month: 8 });
  });

  it("builds a Sunday-first month grid", () => {
    // Sept 2026 starts on a Tuesday -> two leading blanks, 30 days.
    const cells = getMonthCells(2026, 8);

    expect(cells.slice(0, 2)).toEqual([null, null]);
    expect(cells[2]).toBe("2026-09-01");
    expect(cells[cells.length - 1]).toBe("2026-09-30");
    expect(cells.length).toBe(32);
  });

  it("counts blocks per day within the month only", () => {
    const blocks = [
      block({ id: "a", dateKey: "2026-09-03" }),
      block({ id: "b", dateKey: "2026-09-03" }),
      block({ id: "c", dateKey: "2026-10-01" }),
    ];

    expect(countBlocksByDate(blocks, 2026, 8)).toEqual({ "2026-09-03": 2 });
  });
});
