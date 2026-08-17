import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SessionLog, Stats } from "../types/stats";
import { createInitialStats } from "../types/stats";
import type { Settings } from "../types/settings";
import { DEFAULT_SETTINGS } from "../types/settings";
import type { TimerSnapshot } from "../types/timer";

import { STORAGE_KEYS } from "./keys";

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
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.timerSnapshot);
  return parseJson<TimerSnapshot | null>(raw, null);
};

export const saveTimerSnapshot = async (
  snapshot: TimerSnapshot
): Promise<void> => {
  await AsyncStorage.setItem(
    STORAGE_KEYS.timerSnapshot,
    JSON.stringify(snapshot)
  );
};

export const clearTimerSnapshot = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEYS.timerSnapshot);
};

export const loadSessionLogs = async (): Promise<SessionLog[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.sessionLogs);
  return parseJson<SessionLog[]>(raw, []);
};

export const saveSessionLogs = async (logs: SessionLog[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.sessionLogs, JSON.stringify(logs));
};

export const loadStats = async (): Promise<Stats> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.stats);
  return parseJson(raw, createInitialStats());
};

export const saveStats = async (stats: Stats): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
};

export const loadSettings = async (): Promise<Settings> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.settings);
  return parseJson(raw, DEFAULT_SETTINGS);
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
};

export const clearAllData = async (): Promise<void> => {
  await AsyncStorage.removeMany(Object.values(STORAGE_KEYS));
};
