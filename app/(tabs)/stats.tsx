import React, { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AchievementBadges } from "../../components/stats/AchievementBadges";
import { FocusHeatmap } from "../../components/stats/FocusHeatmap";
import { ProjectBreakdown } from "../../components/stats/ProjectBreakdown";
import { SessionTimeline } from "../../components/stats/SessionTimeline";
import { useStats } from "../../context/StatsContext";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import type { StatsPeriod } from "../../domain/statsCalculator";
import { cardElevation } from "../../theme/shadows";

const PERIODS: { key: StatsPeriod; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const StatsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { tasks, projects } = useTasks();
  const {
    stats,
    getWeeklyFocusCounts,
    getPeriodStats,
    formatPeriodDelta,
    getHeatmapActivity,
    getPersonalRecords,
    getProductivityByHour,
    getProductivityByWeekday,
    getFocusByProject,
    getRecentSessions,
    achievements,
  } = useStats();

  const [period, setPeriod] = useState<StatsPeriod>("week");
  const periodStats = getPeriodStats(period);
  const weeklyCounts = getWeeklyFocusCounts();
  const maxWeekCount = Math.max(...weeklyCounts, 1);
  const records = getPersonalRecords();
  const hourCounts = getProductivityByHour();
  const maxHour = Math.max(...hourCounts, 1);
  const weekdayCounts = getProductivityByWeekday();
  const maxWeekday = Math.max(...weekdayCounts, 1);

  const projectStats = getFocusByProject((taskId) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return null;
    }
    const project = projects.find((item) => item.id === task.projectId);
    return project
      ? { id: project.id, name: project.name }
      : { id: task.projectId, name: "Inbox" };
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
        },
        title: {
          fontSize: 28,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          marginBottom: 20,
        },
        cardsRow: {
          flexDirection: "row",
          gap: 12,
          marginBottom: 12,
        },
        card: {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 18,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
          ...cardElevation(isDark),
        },
        cardValue: {
          fontSize: 28,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 4,
        },
        cardLabel: {
          fontSize: 13,
          color: colors.textMuted,
          textAlign: "center",
        },
        section: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 18,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
          ...cardElevation(isDark),
        },
        sectionTitle: {
          fontSize: 17,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 14,
        },
        periodRow: {
          flexDirection: "row",
          gap: 8,
          marginBottom: 14,
        },
        periodChip: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
        },
        periodChipActive: {
          backgroundColor: colors.focus,
          borderColor: colors.focus,
        },
        periodText: {
          fontSize: 14,
          color: colors.textSecondary,
          fontWeight: "600",
        },
        periodTextActive: {
          color: colors.onPrimary,
        },
        periodSummary: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 8,
        },
        periodMetric: {
          fontSize: 14,
          color: colors.text,
        },
        periodDelta: {
          fontSize: 13,
          color: colors.shortBreak,
          marginTop: 4,
        },
        chart: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          height: 120,
        },
        barColumn: {
          flex: 1,
          alignItems: "center",
        },
        barTrack: {
          width: 20,
          height: 80,
          backgroundColor: colors.track,
          borderRadius: 6,
          justifyContent: "flex-end",
          overflow: "hidden",
        },
        barFill: {
          width: "100%",
          backgroundColor: colors.focus,
          borderRadius: 6,
          minHeight: 4,
        },
        barLabel: {
          fontSize: 10,
          color: colors.textMuted,
          marginTop: 4,
        },
        miniChart: {
          flexDirection: "row",
          alignItems: "flex-end",
          height: 60,
          gap: 3,
        },
        miniBar: {
          flex: 1,
          backgroundColor: colors.focus,
          borderRadius: 2,
          minHeight: 2,
        },
        recordRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        recordLabel: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        recordValue: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
        },
        emptyHint: {
          fontSize: 14,
          color: colors.textMuted,
          textAlign: "center",
          paddingVertical: 12,
        },
      }),
    [colors, isDark]
  );

  const resolveTaskTitle = (taskId?: string) => {
    if (!taskId) {
      return null;
    }
    return tasks.find((task) => task.id === taskId)?.title ?? null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Stats</Text>

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{stats.currentStreak}</Text>
            <Text style={styles.cardLabel}>Day streak</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{stats.longestStreak}</Text>
            <Text style={styles.cardLabel}>Best streak</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Period overview</Text>
          <View style={styles.periodRow}>
            {PERIODS.map((item) => (
              <Pressable
                key={item.key}
                style={[
                  styles.periodChip,
                  period === item.key && styles.periodChipActive,
                ]}
                onPress={() => setPeriod(item.key)}
              >
                <Text
                  style={[
                    styles.periodText,
                    period === item.key && styles.periodTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.periodSummary}>
            <Text style={styles.periodMetric}>
              {periodStats.pomodoros} pomodoros · {periodStats.focusMinutes}m
            </Text>
          </View>
          <Text style={styles.periodDelta}>
            vs previous {period}:{" "}
            {formatPeriodDelta(
              periodStats.pomodoros,
              periodStats.previousPomodoros
            )}{" "}
            sessions ·{" "}
            {formatPeriodDelta(
              periodStats.focusMinutes,
              periodStats.previousFocusMinutes
            )}{" "}
            focus time
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 7 days</Text>
          {stats.totalFocusSessions === 0 ? (
            <Text style={styles.emptyHint}>
              Complete a focus session to see your activity here.
            </Text>
          ) : (
            <View style={styles.chart}>
              {weeklyCounts.map((count, index) => (
                <View key={WEEKDAY_LABELS[index]} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${(count / maxWeekCount) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{WEEKDAY_LABELS[index]}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity heatmap</Text>
          <FocusHeatmap activity={getHeatmapActivity(12)} weeks={12} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal records</Text>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>Longest session</Text>
            <Text style={styles.recordValue}>
              {records.longestSessionMinutes}m
            </Text>
          </View>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>Best day</Text>
            <Text style={styles.recordValue}>
              {records.bestDayPomodoros} pomodoros
              {records.bestDayDate ? ` (${records.bestDayDate})` : ""}
            </Text>
          </View>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>Average session</Text>
            <Text style={styles.recordValue}>
              {records.averageSessionMinutes}m
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus by project</Text>
          <ProjectBreakdown data={projectStats} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Peak focus hours</Text>
          <View style={styles.miniChart}>
            {hourCounts.map((count, hour) => (
              <View
                key={hour}
                style={[
                  styles.miniBar,
                  { height: `${(count / maxHour) * 100}%` },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus by weekday</Text>
          <View style={styles.chart}>
            {weekdayCounts.map((count, index) => (
              <View key={WEEKDAY_LABELS[index]} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${(count / maxWeekday) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{WEEKDAY_LABELS[index]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent sessions</Text>
          <SessionTimeline
            sessions={getRecentSessions(15)}
            resolveTaskTitle={resolveTaskTitle}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <AchievementBadges achievements={achievements} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatsScreen;
