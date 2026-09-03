import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useSchedule } from "../../context/ScheduleContext";
import { useSettings } from "../../context/SettingsContext";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import { getPlannedPomodoroCount } from "../../domain/schedule";
import { cardElevation } from "../../theme/shadows";
import { toDateKey } from "../../utils/timer";

export const PlannedToday: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { tasks } = useTasks();
  const { blocks } = useSchedule();
  const { settings } = useSettings();
  const todayKey = toDateKey(
    // eslint-disable-next-line react-hooks/purity -- must refresh each render for overnight-open apps
    Date.now()
  );
  const planned = getPlannedPomodoroCount(
    tasks,
    blocks,
    todayKey,
    settings.focusDurationMinutes
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
          ...cardElevation(isDark),
        },
        label: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
        },
        count: {
          marginTop: 4,
          fontSize: 13,
          color: colors.textMuted,
        },
      }),
    [colors, isDark]
  );

  return (
    <View
      style={styles.card}
      accessibilityRole="text"
      accessibilityLabel={`${planned} planned pomodoros today`}
    >
      <Text style={styles.label}>Today&apos;s plan</Text>
      <Text style={styles.count}>
        {planned === 0
          ? "Nothing planned — add tasks or calendar blocks."
          : `${planned} pomodoro${planned === 1 ? "" : "s"} queued for today`}
      </Text>
    </View>
  );
};
