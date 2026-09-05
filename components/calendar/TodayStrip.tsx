import React, { useMemo } from "react";
import { Text, View } from "react-native";

import { useSchedule } from "../../context/ScheduleContext";
import { useSettings } from "../../context/SettingsContext";
import { useStats } from "../../context/StatsContext";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import { fontFamily } from "../../theme/fonts";
import { getPlannedPomodoroCount } from "../../domain/schedule";
import { toDateKey } from "../../utils/timer";

/**
 * One thin today strip replacing the goal + plan cards on the timer tab.
 * Context at a glance, never competing with the ring.
 */
export const TodayStrip: React.FC = () => {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const { tasks } = useTasks();
  const { blocks } = useSchedule();
  const { getTodayPomodoroCount } = useStats();

  // eslint-disable-next-line react-hooks/purity -- must refresh each render for overnight-open apps
  const todayKey = toDateKey(Date.now());
  const today = getTodayPomodoroCount();
  const goal = settings.dailyPomodoroGoal;
  // Timer ticks every second: memoize the task/block scan so it only runs
  // when the underlying data actually changes.
  const planned = useMemo(
    () =>
      getPlannedPomodoroCount(
        tasks,
        blocks,
        todayKey,
        settings.focusDurationMinutes
      ),
    [tasks, blocks, todayKey, settings.focusDurationMinutes]
  );
  const progress = goal > 0 ? Math.min(1, today / goal) : 0;

  return (
    <View
      className="mb-3"
      accessibilityRole="text"
      accessibilityLabel={`Today ${today} of ${goal} pomodoros, ${planned} planned`}
    >
      <Text
        className="text-sm font-semibold"
        style={{ color: colors.textSecondary, fontFamily: fontFamily.semiBold }}
      >
        Today {today}/{goal} · {planned} queued
      </Text>
      <View
        className="h-[3px] rounded-sm overflow-hidden mt-2"
        style={{ backgroundColor: colors.track }}
      >
        <View
          className="h-full rounded-sm"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: colors.focus,
          }}
        />
      </View>
    </View>
  );
};
