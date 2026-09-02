import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SessionLog, Stats } from "../types/stats";
import { createInitialStats } from "../types/stats";
import type { Settings } from "../types/settings";
import {
  DEFAULT_SETTINGS,
  normalizeAccentId,
  normalizeBreakSoundId,
  normalizeCompletionSoundId,
  normalizeSoundMix,
  normalizeTimerLayout,
} from "../types/settings";
import type { ScheduleBlock } from "../types/schedule";
import type { Project, Task } from "../types/task";
import { createDefaultProject } from "../types/task";
import type { TimerSnapshot } from "../types/timer";

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

export const loadTimerSnapshot = async (): Promise<TimerSnapshot | null> => {
  const raw = await readRaw(STORAGE_KEYS.timerSnapshot);
  return parseJson<TimerSnapshot | null>(raw, null);
};

export const saveTimerSnapshot = async (
  snapshot: TimerSnapshot
): Promise<void> => {
  await writeRaw(
    STORAGE_KEYS.timerSnapshot,
    JSON.stringify(snapshot)
  );
};

export const clearTimerSnapshot = async (): Promise<void> => {
  await removeRaw(STORAGE_KEYS.timerSnapshot);
};

export const loadSessionLogs = async (): Promise<SessionLog[]> => {
  const raw = await readRaw(STORAGE_KEYS.sessionLogs);
  return parseJson<SessionLog[]>(raw, []);
};

export const saveSessionLogs = async (logs: SessionLog[]): Promise<void> => {
  await writeRaw(STORAGE_KEYS.sessionLogs, JSON.stringify(logs));
};

export const loadStats = async (): Promise<Stats> => {
  const raw = await readRaw(STORAGE_KEYS.stats);
  return parseJson(raw, createInitialStats());
};

export const saveStats = async (stats: Stats): Promise<void> => {
  await writeRaw(STORAGE_KEYS.stats, JSON.stringify(stats));
};

export const loadSettings = async (): Promise<Settings> => {
  const raw = await readRaw(STORAGE_KEYS.settings);
  const stored = parseJson<Partial<Settings> | null>(raw, null);

  if (!stored) {
    return DEFAULT_SETTINGS;
  }

  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    soundMix: normalizeSoundMix(stored.soundMix ?? DEFAULT_SETTINGS.soundMix),
    accentId: normalizeAccentId(stored.accentId),
    timerLayout: normalizeTimerLayout(stored.timerLayout),
    completionSoundId: normalizeCompletionSoundId(stored.completionSoundId),
    breakSoundId: normalizeBreakSoundId(stored.breakSoundId),
  };
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  await writeRaw(STORAGE_KEYS.settings, JSON.stringify(settings));
};

export const loadTasks = async (): Promise<Task[]> => {
  const raw = await readRaw(STORAGE_KEYS.tasks);
  return parseJson<Task[]>(raw, []);
};

export const saveTasks = async (tasks: Task[]): Promise<void> => {
  await writeRaw(STORAGE_KEYS.tasks, JSON.stringify(tasks));
};

export const loadProjects = async (): Promise<Project[]> => {
  const raw = await readRaw(STORAGE_KEYS.projects);
  const projects = parseJson<Project[]>(raw, []);
  return projects.length > 0 ? projects : [createDefaultProject()];
};

export const saveProjects = async (projects: Project[]): Promise<void> => {
  await writeRaw(STORAGE_KEYS.projects, JSON.stringify(projects));
};

export const loadActiveTaskId = async (): Promise<string | null> => {
  return readRaw(STORAGE_KEYS.activeTaskId);
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
  return parseJson<Record<string, number>>(raw, {});
};

export const saveAchievements = async (
  unlocked: Record<string, number>
): Promise<void> => {
  await writeRaw(STORAGE_KEYS.achievements, JSON.stringify(unlocked));
};

export const loadScheduleBlocks = async (): Promise<ScheduleBlock[]> => {
  const raw = await readRaw(STORAGE_KEYS.scheduleBlocks);
  return parseJson<ScheduleBlock[]>(raw, []);
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
