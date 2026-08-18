import type { Task, TaskView } from "../types/task";
import { toDateKey } from "../utils/timer";

export const filterTasksByView = (
  tasks: Task[],
  view: TaskView,
  todayKey: string = toDateKey(Date.now())
): Task[] => {
  switch (view) {
    case "completed":
      return tasks
        .filter((task) => task.status === "completed")
        .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
    case "today":
      return tasks
        .filter(
          (task) =>
            task.status === "active" &&
            task.dueDate !== null &&
            task.dueDate <= todayKey
        )
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
    case "inbox":
    default:
      return tasks
        .filter(
          (task) =>
            task.status === "active" &&
            (task.dueDate === null || task.dueDate > todayKey)
        )
        .sort((a, b) => b.createdAt - a.createdAt);
  }
};

export const filterTasksByProject = (
  tasks: Task[],
  projectId: string | null
): Task[] => {
  if (projectId === null) {
    return tasks;
  }
  return tasks.filter((task) => task.projectId === projectId);
};
