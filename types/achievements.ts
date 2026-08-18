export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

export interface AchievementProgress {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt: number | null;
}
