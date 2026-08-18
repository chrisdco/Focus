import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loadSessionLogs,
  loadStats,
  saveSessionLogs,
  saveStats,
} from "../storage";
import type { SessionLog, Stats } from "../types/stats";
import { createInitialStats } from "../types/stats";
import type { TimerMode } from "../types/timer";
import { getDaysBetween, toDateKey } from "../utils/timer";

interface StatsContextValue {
  logs: SessionLog[];
  stats: Stats;
  logSession: (mode: TimerMode, durationMs: number, taskId?: string) => void;
  getWeeklyFocusCounts: () => number[];
  resetStats: () => void;
  isHydrated: boolean;
}

const StatsContext = createContext<StatsContextValue | undefined>(undefined);

const computeStreak = (logs: SessionLog[]): Pick<Stats, "currentStreak" | "longestStreak" | "lastCompletedDate"> => {
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
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [stats, setStats] = useState<Stats>(createInitialStats());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const [storedLogs, storedStats] = await Promise.all([
        loadSessionLogs(),
        loadStats(),
      ]);
      setLogs(storedLogs);
      setStats(storedStats.totalFocusSessions > 0 ? storedStats : deriveStats(storedLogs));
      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  const persist = useCallback(async (nextLogs: SessionLog[], nextStats: Stats) => {
    await Promise.all([saveSessionLogs(nextLogs), saveStats(nextStats)]);
  }, []);

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
        void persist(nextLogs, nextStats);
        return nextLogs;
      });
    },
    [persist]
  );

  const getWeeklyFocusCounts = useCallback((): number[] => {
    const counts = Array.from({ length: 7 }, () => 0);
    const now = new Date();

    for (const log of logs) {
      if (log.mode !== "focus") {
        continue;
      }

      const logDate = new Date(log.completedAt);
      const diffDays = Math.floor(
        (now.getTime() - logDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (diffDays >= 0 && diffDays < 7) {
        counts[6 - diffDays] += 1;
      }
    }

    return counts;
  }, [logs]);

  const resetStats = useCallback(() => {
    setLogs([]);
    setStats(createInitialStats());
    void persist([], createInitialStats());
  }, [persist]);

  const value = useMemo(
    () => ({
      logs,
      stats,
      logSession,
      getWeeklyFocusCounts,
      resetStats,
      isHydrated,
    }),
    [logs, stats, logSession, getWeeklyFocusCounts, resetStats, isHydrated]
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
