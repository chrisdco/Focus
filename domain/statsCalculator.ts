import type { SessionLog } from "../types/stats";
import { toDateKey } from "../utils/timer";

export type StatsPeriod = "day" | "week" | "month";

export interface PeriodStats {
  pomodoros: number;
  focusMinutes: number;
  previousPomodoros: number;
  previousFocusMinutes: number;
}

export interface PersonalRecords {
  longestSessionMinutes: number;
  bestDayPomodoros: number;
  bestDayDate: string | null;
  averageSessionMinutes: number;
}

export interface DayActivity {
  dateKey: string;
  pomodoros: number;
  focusMinutes: number;
}

export interface ProjectFocusStat {
  projectId: string;
  label: string;
  focusMinutes: number;
  pomodoros: number;
}

const focusLogs = (logs: SessionLog[]): SessionLog[] =>
  logs.filter((log) => log.mode === "focus");

export const getTodayPomodoroCount = (logs: SessionLog[]): number => {
  const today = toDateKey(Date.now());
  return focusLogs(logs).filter((log) => toDateKey(log.completedAt) === today)
    .length;
};

const startOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const getPeriodRange = (
  period: StatsPeriod,
  offset = 0
): { start: number; end: number } => {
  const now = new Date();
  const end = startOfDay(now);
  end.setDate(end.getDate() + 1);

  const start = new Date(end);

  if (period === "day") {
    start.setDate(start.getDate() - 1 + offset);
    end.setDate(end.getDate() + offset);
  } else if (period === "week") {
    start.setDate(start.getDate() - 7 + offset * 7);
    end.setDate(end.getDate() + offset * 7);
  } else {
    start.setMonth(start.getMonth() - 1 + offset);
    end.setMonth(end.getMonth() + offset);
  }

  return { start: start.getTime(), end: end.getTime() };
};

export const getPeriodStats = (
  logs: SessionLog[],
  period: StatsPeriod
): PeriodStats => {
  const current = getPeriodRange(period, 0);
  const previous = getPeriodRange(period, -1);

  const inRange = (log: SessionLog, range: { start: number; end: number }) =>
    log.completedAt >= range.start && log.completedAt < range.end;

  const currentLogs = focusLogs(logs).filter((log) => inRange(log, current));
  const previousLogs = focusLogs(logs).filter((log) =>
    inRange(log, previous)
  );

  return {
    pomodoros: currentLogs.length,
    focusMinutes: Math.round(
      currentLogs.reduce((sum, log) => sum + log.durationMs, 0) / 60000
    ),
    previousPomodoros: previousLogs.length,
    previousFocusMinutes: Math.round(
      previousLogs.reduce((sum, log) => sum + log.durationMs, 0) / 60000
    ),
  };
};

export const formatPeriodDelta = (
  current: number,
  previous: number
): string => {
  if (previous === 0) {
    return current > 0 ? "+100%" : "—";
  }
  const delta = Math.round(((current - previous) / previous) * 100);
  return delta >= 0 ? `+${delta}%` : `${delta}%`;
};

export const getFocusActivityByDay = (
  logs: SessionLog[],
  days: number
): DayActivity[] => {
  const result: DayActivity[] = [];
  const today = startOfDay(new Date());

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = toDateKey(date.getTime());
    const dayLogs = focusLogs(logs).filter(
      (log) => toDateKey(log.completedAt) === dateKey
    );

    result.push({
      dateKey,
      pomodoros: dayLogs.length,
      focusMinutes: Math.round(
        dayLogs.reduce((sum, log) => sum + log.durationMs, 0) / 60000
      ),
    });
  }

  return result;
};

export const getPersonalRecords = (logs: SessionLog[]): PersonalRecords => {
  const focus = focusLogs(logs);

  if (focus.length === 0) {
    return {
      longestSessionMinutes: 0,
      bestDayPomodoros: 0,
      bestDayDate: null,
      averageSessionMinutes: 0,
    };
  }

  const longestSessionMinutes = Math.round(
    Math.max(...focus.map((log) => log.durationMs)) / 60000
  );

  const byDay = new Map<string, number>();
  for (const log of focus) {
    const key = toDateKey(log.completedAt);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  let bestDayPomodoros = 0;
  let bestDayDate: string | null = null;
  for (const [dateKey, count] of byDay.entries()) {
    if (count > bestDayPomodoros) {
      bestDayPomodoros = count;
      bestDayDate = dateKey;
    }
  }

  const averageSessionMinutes = Math.round(
    focus.reduce((sum, log) => sum + log.durationMs, 0) /
      focus.length /
      60000
  );

  return {
    longestSessionMinutes,
    bestDayPomodoros,
    bestDayDate,
    averageSessionMinutes,
  };
};

export const getProductivityByHour = (logs: SessionLog[]): number[] => {
  const counts = Array.from({ length: 24 }, () => 0);

  for (const log of focusLogs(logs)) {
    const hour = new Date(log.completedAt).getHours();
    counts[hour] += 1;
  }

  return counts;
};

export const getProductivityByWeekday = (logs: SessionLog[]): number[] => {
  const counts = Array.from({ length: 7 }, () => 0);

  for (const log of focusLogs(logs)) {
    const day = new Date(log.completedAt).getDay();
    const index = day === 0 ? 6 : day - 1;
    counts[index] += 1;
  }

  return counts;
};

export const getFocusByTaskProject = (
  logs: SessionLog[],
  resolveProject: (taskId: string) => { id: string; name: string } | null
): ProjectFocusStat[] => {
  const totals = new Map<string, ProjectFocusStat>();

  for (const log of focusLogs(logs)) {
    if (!log.taskId) {
      continue;
    }

    const project = resolveProject(log.taskId);
    const id = project?.id ?? "unknown";
    const label = project?.name ?? "Unknown";

    const existing = totals.get(id) ?? {
      projectId: id,
      label,
      focusMinutes: 0,
      pomodoros: 0,
    };

    existing.focusMinutes += Math.round(log.durationMs / 60000);
    existing.pomodoros += 1;
    totals.set(id, existing);
  }

  return [...totals.values()].sort((a, b) => b.focusMinutes - a.focusMinutes);
};

export const getRecentSessions = (
  logs: SessionLog[],
  limit = 20
): SessionLog[] => {
  return [...logs]
    .filter((log) => log.mode === "focus")
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, limit);
};
