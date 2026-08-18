export type TaskPriority = "low" | "medium" | "high";

export type TaskStatus = "active" | "completed";

export const INBOX_PROJECT_ID = "inbox";

export interface Project {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  projectId: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  priority: TaskPriority;
  /** ISO date string YYYY-MM-DD, or null */
  dueDate: string | null;
  tags: string[];
  status: TaskStatus;
  createdAt: number;
  completedAt: number | null;
}

export type TaskView = "inbox" | "today" | "completed";

export interface TaskDraft {
  title: string;
  notes: string;
  projectId: string;
  estimatedPomodoros: number;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
}

export const createDefaultProject = (): Project => ({
  id: INBOX_PROJECT_ID,
  name: "Inbox",
  color: "#4F46E5",
  sortOrder: 0,
  createdAt: Date.now(),
});

export const createEmptyTaskDraft = (
  projectId: string = INBOX_PROJECT_ID
): TaskDraft => ({
  title: "",
  notes: "",
  projectId,
  estimatedPomodoros: 1,
  priority: "medium",
  dueDate: null,
  tags: [],
});

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "#6B7280",
  medium: "#F59E0B",
  high: "#EF4444",
};
