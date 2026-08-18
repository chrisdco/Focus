import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useSettings } from "../../context/SettingsContext";
import { useStats } from "../../context/StatsContext";
import { useTheme } from "../../context/ThemeContext";
import { cardElevation } from "../../theme/shadows";

export const DailyGoalProgress: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { settings } = useSettings();
  const { getTodayPomodoroCount } = useStats();

  const today = getTodayPomodoroCount();
  const goal = settings.dailyPomodoroGoal;
  const progress = goal > 0 ? Math.min(1, today / goal) : 0;
  const goalMet = today >= goal && goal > 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
          ...cardElevation(isDark),
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        },
        label: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
        },
        count: {
          fontSize: 15,
          color: colors.textMuted,
        },
        track: {
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.track,
          overflow: "hidden",
        },
        fill: {
          height: "100%",
          borderRadius: 4,
          backgroundColor: goalMet ? colors.shortBreak : colors.focus,
          width: `${progress * 100}%`,
        },
        hint: {
          marginTop: 8,
          fontSize: 13,
          color: goalMet ? colors.shortBreak : colors.textMuted,
        },
      }),
    [colors, isDark, goalMet, progress]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Today&apos;s goal</Text>
        <Text style={styles.count}>
          {today}/{goal} pomodoros
        </Text>
      </View>
      <View style={styles.track}>
        <View style={styles.fill} />
      </View>
      <Text style={styles.hint}>
        {goalMet
          ? "Daily goal reached — nice work!"
          : `${goal - today} more to hit your goal`}
      </Text>
    </View>
  );
};
