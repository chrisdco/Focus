import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ACHIEVEMENTS, evaluateAchievements } from "../data/achievements";
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
  type DayActivity,
  type PeriodStats,
  type PersonalRecords,
  type ProjectFocusStat,
  type StatsPeriod,
} from "../domain/statsCalculator";
import {
  loadAchievements,
  loadSessionLogs,
  loadStats,
  saveAchievements,
  saveSessionLogs,
  saveStats,
} from "../storage";
import type { AchievementProgress } from "../types/achievements";
import type { SessionLog, Stats } from "../types/stats";
import { createInitialStats } from "../types/stats";
import type { TimerMode } from "../types/timer";
import { getDaysBetween, toDateKey } from "../utils/timer";
import { useSettings } from "./SettingsContext";

interface StatsContextValue {
  logs: SessionLog[];
  stats: Stats;
  logSession: (mode: TimerMode, durationMs: number, taskId?: string) => void;
  getWeeklyActivity: () => DayActivity[];
  getTodayPomodoroCount: () => number;
  getPeriodStats: (period: StatsPeriod) => PeriodStats;
  formatPeriodDelta: (current: number, previous: number) => string;
  getHeatmapActivity: (weeks: number) => ReturnType<typeof getFocusActivityByDay>;
  getPersonalRecords: () => PersonalRecords;
  getProductivityByHour: () => number[];
  getProductivityByWeekday: () => number[];
  getFocusByProject: (
    resolveProject: (taskId: string) => { id: string; name: string } | null
  ) => ProjectFocusStat[];
  getRecentSessions: (limit?: number) => SessionLog[];
  achievements: AchievementProgress[];
  resetStats: () => void;
  isHydrated: boolean;
}

const StatsContext = createContext<StatsContextValue | undefined>(undefined);

const computeStreak = (
  logs: SessionLog[]
): Pick<Stats, "currentStreak" | "longestStreak" | "lastCompletedDate"> => {
  const focusDates = [
    ...new Set(
      logs
        .filter((log) => log.mode === "focus")
        .map((log) => toDateKey(log.completedAt))
    ),
  ].sort();

  if (focusDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastCompletedDate: null };
  }

  const lastCompletedDate = focusDates[focusDates.length - 1];
  const today = toDateKey(Date.now());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = toDateKey(yesterdayDate.getTime());

  let currentStreak = 0;
  if (lastCompletedDate === today || lastCompletedDate === yesterday) {
    currentStreak = 1;
    for (let i = focusDates.length - 2; i >= 0; i -= 1) {
      const gap = getDaysBetween(focusDates[i], focusDates[i + 1]);
      if (gap === 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  let longestStreak = 0;
  let running = 0;
  for (let i = 0; i < focusDates.length; i += 1) {
    if (i === 0) {
      running = 1;
    } else {
      const gap = getDaysBetween(focusDates[i - 1], focusDates[i]);
      running = gap === 1 ? running + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, running);
  }

  return { currentStreak, longestStreak, lastCompletedDate };
};

const deriveStats = (logs: SessionLog[]): Stats => {
  const focusLogs = logs.filter((log) => log.mode === "focus");
  const streak = computeStreak(logs);

  return {
    totalFocusSessions: focusLogs.length,
    totalFocusMinutes: Math.round(
      focusLogs.reduce((sum, log) => sum + log.durationMs, 0) / 60000
    ),
    ...streak,
  };
};

interface StatsProviderProps {
  children: ReactNode;
}

export const StatsProvider: React.FC<StatsProviderProps> = ({ children }) => {
  const { settings } = useSettings();
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [stats, setStats] = useState<Stats>(createInitialStats());
  const [unlockedMap, setUnlockedMap] = useState<Record<string, number>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const [storedLogs, storedStats, storedAchievements] = await Promise.all([
        loadSessionLogs(),
        loadStats(),
        loadAchievements(),
      ]);
      setLogs(storedLogs);
      setStats(
        storedStats.totalFocusSessions > 0
          ? storedStats
          : deriveStats(storedLogs)
      );
      setUnlockedMap(storedAchievements);
      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  const persist = useCallback(
    async (
      nextLogs: SessionLog[],
      nextStats: Stats,
      nextAchievements?: Record<string, number>
    ) => {
      await Promise.all([
        saveSessionLogs(nextLogs),
        saveStats(nextStats),
        nextAchievements
          ? saveAchievements(nextAchievements)
          : Promise.resolve(),
      ]);
    },
    []
  );

  const unlockAchievements = useCallback(
    (nextStats: Stats, nextLogs: SessionLog[], currentUnlocked: Record<string, number>) => {
      const todayCount = getTodayPomodoroCount(nextLogs);
      const newly = evaluateAchievements(
        nextStats,
        todayCount,
        settings.dailyPomodoroGoal,
        new Set(Object.keys(currentUnlocked))
      );

      if (newly.length === 0) {
        return currentUnlocked;
      }

      const updated = { ...currentUnlocked };
      const now = Date.now();
      for (const id of newly) {
        updated[id] = now;
      }
      return updated;
    },
    [settings.dailyPomodoroGoal]
  );

  const logSession = useCallback(
    (mode: TimerMode, durationMs: number, taskId?: string) => {
      setLogs((prevLogs) => {
        const entry: SessionLog = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          mode,
          durationMs,
          completedAt: Date.now(),
          ...(taskId ? { taskId } : {}),
        };
        const nextLogs = [...prevLogs, entry];
        const nextStats = deriveStats(nextLogs);

        setStats(nextStats);
        setUnlockedMap((prevUnlocked) => {
          const nextAchievements = unlockAchievements(
            nextStats,
            nextLogs,
            prevUnlocked
          );
          void persist(nextLogs, nextStats, nextAchievements);
          return nextAchievements;
        });

        return nextLogs;
      });
    },
    [persist, unlockAchievements]
  );

  const getWeeklyActivity = useCallback(
    (): DayActivity[] => getFocusActivityByDay(logs, 7),
    [logs]
  );

  const achievements = useMemo((): AchievementProgress[] => {
    return ACHIEVEMENTS.map((achievement) => ({
      achievement,
      unlocked: achievement.id in unlockedMap,
      unlockedAt: unlockedMap[achievement.id] ?? null,
    }));
  }, [unlockedMap]);

  const resetStats = useCallback(() => {
    setLogs([]);
    setStats(createInitialStats());
    setUnlockedMap({});
    void persist([], createInitialStats(), {});
  }, [persist]);

  const value = useMemo(
    () => ({
      logs,
      stats,
      logSession,
      getWeeklyActivity,
      getTodayPomodoroCount: () => getTodayPomodoroCount(logs),
      getPeriodStats: (period: StatsPeriod) => getPeriodStats(logs, period),
      formatPeriodDelta,
      getHeatmapActivity: (weeks: number) =>
        getFocusActivityByDay(logs, weeks * 7),
      getPersonalRecords: () => getPersonalRecords(logs),
      getProductivityByHour: () => getProductivityByHour(logs),
      getProductivityByWeekday: () => getProductivityByWeekday(logs),
      getFocusByProject: (
        resolveProject: (taskId: string) => { id: string; name: string } | null
      ) => getFocusByTaskProject(logs, resolveProject),
      getRecentSessions: (limit?: number) => getRecentSessions(logs, limit),
      achievements,
      resetStats,
      isHydrated,
    }),
    [
      logs,
      stats,
      logSession,
      getWeeklyActivity,
      achievements,
      resetStats,
      isHydrated,
    ]
  );

  return (
    <StatsContext.Provider value={value}>{children}</StatsContext.Provider>
  );
};

export const useStats = (): StatsContextValue => {
  const context = useContext(StatsContext);

  if (!context) {
    throw new Error("useStats must be used within a StatsProvider");
  }

  return context;
};
