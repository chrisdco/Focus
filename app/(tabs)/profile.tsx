import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStats } from "../../context/StatsContext";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import { cardElevation } from "../../theme/shadows";
import { displayFont } from "../../theme/fonts";
import { type as typeScale } from "../../theme/typography";

const APP_VERSION = "1.0.0";

const ProfileScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { stats, getTodayPomodoroCount } = useStats();
  const { tasks } = useTasks();

  const today = getTodayPomodoroCount();
  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        },
        headerTitle: {
          ...typeScale.title,
          color: colors.text,
        },
        gear: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        hero: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
          ...cardElevation(isDark),
        },
        heroValue: {
          fontSize: 44,
          fontWeight: "700",
          color: colors.text,
          fontFamily: displayFont.bold,
        },
        heroLabel: {
          fontSize: 14,
          color: colors.textMuted,
          marginTop: 4,
        },
        group: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
          overflow: "hidden",
          ...cardElevation(isDark),
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          minHeight: 48,
        },
        rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
        rowLabel: { fontSize: 16, color: colors.text },
        rowValue: { fontSize: 15, color: colors.textMuted },
        version: {
          textAlign: "center",
          fontSize: 13,
          color: colors.textMuted,
        },
      }),
    [colors, isDark]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable
            style={styles.gear}
            onPress={() => router.push("/settings")}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View
          style={styles.hero}
          accessibilityRole="text"
          accessibilityLabel={`${stats.currentStreak} day streak, ${today} pomodoros today`}
        >
          <Text style={styles.heroValue}>{stats.currentStreak}</Text>
          <Text style={styles.heroLabel}>
            day streak · {today} today · best {stats.longestStreak}
          </Text>
        </View>

        <View style={styles.group}>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Focus sessions</Text>
            <Text style={styles.rowValue}>{stats.totalFocusSessions}</Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Focus minutes</Text>
            <Text style={styles.rowValue}>{stats.totalFocusMinutes}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tasks completed</Text>
            <Text style={styles.rowValue}>{completedTasks}</Text>
          </View>
        </View>

        <View style={styles.group}>
          <Pressable
            style={styles.row}
            onPress={() => router.push("/settings")}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Text style={styles.rowLabel}>Settings</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <Text style={styles.version}>Foco {APP_VERSION}</Text>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;
