import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useSchedule } from "../../context/ScheduleContext";
import { useSettings } from "../../context/SettingsContext";
import { useStats } from "../../context/StatsContext";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { marginBottom: 12 },
        line: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        track: {
          height: 3,
          borderRadius: 2,
          backgroundColor: colors.track,
          overflow: "hidden",
          marginTop: 8,
        },
        fill: {
          height: "100%",
          borderRadius: 2,
          backgroundColor: colors.focus,
        },
      }),
    [colors]
  );

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={`Today ${today} of ${goal} pomodoros, ${planned} planned`}
    >
      <Text style={styles.line}>
        Today {today}/{goal} · {planned} queued
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};
