import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SessionLog, Stats } from "../types/stats";
import { createInitialStats } from "../types/stats";
import type { Settings } from "../types/settings";
import { DEFAULT_SETTINGS, normalizeSettings } from "../types/settings";
import type { ScheduleBlock } from "../types/schedule";
import type { Project, Task } from "../types/task";
import { createDefaultProject } from "../types/task";
import type { TimerSnapshot } from "../types/timer";
import { isValidTimerSnapshot } from "../utils/timer";

import { STORAGE_KEYS } from "./keys";

const readRaw = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn(`[foco] Failed to read "${key}" from storage.`, error);
    return null;
  }
};

const writeRaw = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[foco] Failed to save "${key}" to storage.`, error);
  }
};

const removeRaw = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`[foco] Failed to remove "${key}" from storage.`, error);
  }
};

const parseJson = <T>(raw: string | null, fallback: T): T => {
  if (raw === null) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const isRecordOfNumbers = (value: unknown): value is Record<string, number> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value as Record<string, unknown>).every(
    (v) => typeof v === "number" && Number.isFinite(v)
  );
};

const isValidSessionLog = (value: unknown): value is SessionLog => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    (v.mode === "focus" || v.mode === "shortBreak" || v.mode === "longBreak") &&
    typeof v.durationMs === "number" &&
    Number.isFinite(v.durationMs) &&
    v.durationMs >= 0 &&
    typeof v.completedAt === "number" &&
    Number.isFinite(v.completedAt) &&
    (v.taskId === undefined || typeof v.taskId === "string")
  );
};

const isValidStats = (value: unknown): value is Stats => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.totalFocusSessions === "number" &&
    typeof v.totalFocusMinutes === "number" &&
    typeof v.currentStreak === "number" &&
    typeof v.longestStreak === "number" &&
    (v.lastCompletedDate === null || typeof v.lastCompletedDate === "string")
  );
};

const isValidTask = (value: unknown): value is Task => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.projectId === "string" &&
    typeof v.estimatedPomodoros === "number" &&
    Number.isFinite(v.estimatedPomodoros) &&
    typeof v.completedPomodoros === "number" &&
    Number.isFinite(v.completedPomodoros) &&
    (v.status === "active" || v.status === "completed") &&
    typeof v.createdAt === "number" &&
    (v.dueDate === null || typeof v.dueDate === "string") &&
    Array.isArray(v.tags)
  );
};

const isValidProject = (value: unknown): value is Project => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.color === "string" &&
    typeof v.sortOrder === "number" &&
    typeof v.createdAt === "number"
  );
};

const isValidScheduleBlock = (value: unknown): value is ScheduleBlock => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.dateKey === "string" &&
    typeof v.startMinutes === "number" &&
    Number.isFinite(v.startMinutes) &&
    typeof v.durationMinutes === "number" &&
    Number.isFinite(v.durationMinutes) &&
    (v.kind === "focus" || v.kind === "shortBreak" || v.kind === "longBreak") &&
    (v.taskId === null || typeof v.taskId === "string")
  );
};

export const loadTimerSnapshot = async (): Promise<TimerSnapshot | null> => {
  const raw = await readRaw(STORAGE_KEYS.timerSnapshot);
  const parsed = parseJson<unknown>(raw, null);
  return isValidTimerSnapshot(parsed) ? parsed : null;
};

export const saveTimerSnapshot = async (
  snapshot: TimerSnapshot
): Promise<void> => {
  await writeRaw(STORAGE_KEYS.timerSnapshot, JSON.stringify(snapshot));
};

export const clearTimerSnapshot = async (): Promise<void> => {
  await removeRaw(STORAGE_KEYS.timerSnapshot);
};

export const loadSessionLogs = async (): Promise<SessionLog[]> => {
  const raw = await readRaw(STORAGE_KEYS.sessionLogs);
  const parsed = parseJson<unknown>(raw, []);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(isValidSessionLog);
};

export const saveSessionLogs = async (logs: SessionLog[]): Promise<void> => {
  await writeRaw(STORAGE_KEYS.sessionLogs, JSON.stringify(logs));
};

export const loadStats = async (): Promise<Stats> => {
  const raw = await readRaw(STORAGE_KEYS.stats);
  const parsed = parseJson<unknown>(raw, null);
  return isValidStats(parsed) ? parsed : createInitialStats();
};

export const saveStats = async (stats: Stats): Promise<void> => {
  await writeRaw(STORAGE_KEYS.stats, JSON.stringify(stats));
};

export const loadSettings = async (): Promise<Settings> => {
  const raw = await readRaw(STORAGE_KEYS.settings);
  const stored = parseJson<Partial<Settings> | null>(raw, null);

  if (!stored || typeof stored !== "object") {
    return DEFAULT_SETTINGS;
  }

  return normalizeSettings(stored);
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  await writeRaw(STORAGE_KEYS.settings, JSON.stringify(settings));
};

export const loadTasks = async (): Promise<Task[]> => {
  const raw = await readRaw(STORAGE_KEYS.tasks);
  const parsed = parseJson<unknown>(raw, []);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(isValidTask);
};

export const saveTasks = async (tasks: Task[]): Promise<void> => {
  await writeRaw(STORAGE_KEYS.tasks, JSON.stringify(tasks));
};

export const loadProjects = async (): Promise<Project[]> => {
  const raw = await readRaw(STORAGE_KEYS.projects);
  const parsed = parseJson<unknown>(raw, []);
  const projects = Array.isArray(parsed) ? parsed.filter(isValidProject) : [];
  return projects.length > 0 ? projects : [createDefaultProject()];
};

export const saveProjects = async (projects: Project[]): Promise<void> => {
  await writeRaw(STORAGE_KEYS.projects, JSON.stringify(projects));
};

export const loadActiveTaskId = async (): Promise<string | null> => {
  const raw = await readRaw(STORAGE_KEYS.activeTaskId);
  return typeof raw === "string" && raw.length > 0 ? raw : null;
};

export const saveActiveTaskId = async (taskId: string | null): Promise<void> => {
  if (taskId === null) {
    await removeRaw(STORAGE_KEYS.activeTaskId);
    return;
  }
  await writeRaw(STORAGE_KEYS.activeTaskId, taskId);
};

export const loadAchievements = async (): Promise<Record<string, number>> => {
  const raw = await readRaw(STORAGE_KEYS.achievements);
  const parsed = parseJson<unknown>(raw, {});
  return isRecordOfNumbers(parsed) ? parsed : {};
};

export const saveAchievements = async (
  unlocked: Record<string, number>
): Promise<void> => {
  await writeRaw(STORAGE_KEYS.achievements, JSON.stringify(unlocked));
};

export const loadScheduleBlocks = async (): Promise<ScheduleBlock[]> => {
  const raw = await readRaw(STORAGE_KEYS.scheduleBlocks);
  const parsed = parseJson<unknown>(raw, []);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(isValidScheduleBlock);
};

export const saveScheduleBlocks = async (
  blocks: ScheduleBlock[]
): Promise<void> => {
  await writeRaw(STORAGE_KEYS.scheduleBlocks, JSON.stringify(blocks));
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.warn("[foco] Failed to clear storage.", error);
  }
};
