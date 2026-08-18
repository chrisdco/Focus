import type { Achievement } from "../types/achievements";
import type { Stats } from "../types/stats";

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_pomodoro",
    title: "First focus",
    description: "Complete your first pomodoro",
    emoji: "🌱",
  },
  {
    id: "streak_3",
    title: "On a roll",
    description: "Reach a 3-day streak",
    emoji: "🔥",
  },
  {
    id: "streak_7",
    title: "Week warrior",
    description: "Reach a 7-day streak",
    emoji: "⚡",
  },
  {
    id: "sessions_10",
    title: "Getting started",
    description: "Complete 10 focus sessions",
    emoji: "🎯",
  },
  {
    id: "sessions_50",
    title: "Deep worker",
    description: "Complete 50 focus sessions",
    emoji: "💪",
  },
  {
    id: "sessions_100",
    title: "Century club",
    description: "Complete 100 focus sessions",
    emoji: "🏆",
  },
  {
    id: "minutes_300",
    title: "Five hours",
    description: "Log 300 focus minutes total",
    emoji: "⏱️",
  },
  {
    id: "daily_goal",
    title: "Goal crusher",
    description: "Hit your daily pomodoro goal",
    emoji: "✨",
  },
];

export const evaluateAchievements = (
  stats: Stats,
  todayPomodoros: number,
  dailyGoal: number,
  alreadyUnlocked: Set<string>
): string[] => {
  const newlyUnlocked: string[] = [];

  const checks: Record<string, boolean> = {
    first_pomodoro: stats.totalFocusSessions >= 1,
    streak_3: stats.currentStreak >= 3,
    streak_7: stats.currentStreak >= 7,
    sessions_10: stats.totalFocusSessions >= 10,
    sessions_50: stats.totalFocusSessions >= 50,
    sessions_100: stats.totalFocusSessions >= 100,
    minutes_300: stats.totalFocusMinutes >= 300,
    daily_goal: dailyGoal > 0 && todayPomodoros >= dailyGoal,
  };

  for (const [id, met] of Object.entries(checks)) {
    if (met && !alreadyUnlocked.has(id)) {
      newlyUnlocked.push(id);
    }
  }

  return newlyUnlocked;
};
