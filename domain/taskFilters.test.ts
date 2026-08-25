import { describe, expect, it } from "vitest";

import type { Task } from "../types/task";
import { filterTasksByProject, filterTasksByView } from "./taskFilters";

const TODAY = "2026-08-25";

let seq = 0;

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: `task-${(seq += 1)}`,
  title: "Task",
  notes: "",
  projectId: "inbox",
  estimatedPomodoros: 1,
  completedPomodoros: 0,
  priority: "medium",
  dueDate: null,
  tags: [],
  status: "active",
  createdAt: seq,
  completedAt: null,
  ...overrides,
});

describe("filterTasksByView", () => {
  it("inbox shows undated and future-dated active tasks, newest first", () => {
    const tasks = [
      makeTask({ title: "old", createdAt: 1 }),
      makeTask({ title: "new", createdAt: 2 }),
      makeTask({ title: "future", createdAt: 3, dueDate: "2026-09-01" }),
      makeTask({ title: "due-today", createdAt: 4, dueDate: TODAY }),
      makeTask({ title: "overdue", createdAt: 5, dueDate: "2026-08-20" }),
      makeTask({
        title: "done-undated",
        status: "completed",
        completedAt: 9,
      }),
    ];

    const inbox = filterTasksByView(tasks, "inbox", TODAY);

    expect(inbox.map((task) => task.title)).toEqual([
      "future",
      "new",
      "old",
    ]);
  });

  it("today shows due-or-overdue active tasks by due date", () => {
    const tasks = [
      makeTask({ title: "overdue", dueDate: "2026-08-20", createdAt: 1 }),
      makeTask({ title: "today", dueDate: TODAY, createdAt: 2 }),
      makeTask({ title: "future", dueDate: "2026-09-01", createdAt: 3 }),
      makeTask({ title: "undated", createdAt: 4 }),
      makeTask({
        title: "completed-due-today",
        dueDate: TODAY,
        status: "completed",
        completedAt: 5,
        createdAt: 6,
      }),
    ];

    const today = filterTasksByView(tasks, "today", TODAY);

    expect(today.map((task) => task.title)).toEqual(["overdue", "today"]);
  });

  it("completed shows finished tasks by completion date desc", () => {
    const tasks = [
      makeTask({
        title: "first",
        status: "completed",
        completedAt: 100,
      }),
      makeTask({
        title: "latest",
        status: "completed",
        completedAt: 300,
      }),
      makeTask({
        title: "second",
        status: "completed",
        completedAt: 200,
      }),
      makeTask({ title: "active", createdAt: 400 }),
    ];

    const completed = filterTasksByView(tasks, "completed", TODAY);

    expect(completed.map((task) => task.title)).toEqual([
      "latest",
      "second",
      "first",
    ]);
  });
});

describe("filterTasksByProject", () => {
  it("returns all tasks when no project is selected", () => {
    const tasks = [makeTask(), makeTask({ projectId: "work" })];

    expect(filterTasksByProject(tasks, null)).toBe(tasks);
  });

  it("filters tasks to the selected project", () => {
    const tasks = [
      makeTask({ title: "a", projectId: "work" }),
      makeTask({ title: "b", projectId: "home" }),
      makeTask({ title: "c", projectId: "work" }),
    ];

    const filtered = filterTasksByProject(tasks, "work");

    expect(filtered.map((task) => task.title)).toEqual(["a", "c"]);
  });
});
