import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AchievementBadges } from "../../components/stats/AchievementBadges";
import { BarChart } from "../../components/stats/BarChart";
import { FocusHeatmap } from "../../components/stats/FocusHeatmap";
import { ProjectBreakdown } from "../../components/stats/ProjectBreakdown";
import { SessionTimeline } from "../../components/stats/SessionTimeline";
import { CollapsibleSection } from "../../components/ui/CollapsibleSection";
import { EmptyState } from "../../components/ui/EmptyState";
import { ScreenTitle } from "../../components/ui/ScreenTitle";
import { Segmented } from "../../components/ui/Segmented";
import { useStats } from "../../context/StatsContext";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import type { StatsPeriod } from "../../domain/statsCalculator";
import { cardElevation } from "../../theme/shadows";
import { fontFamily } from "../../theme/fonts";
import { type as typeScale } from "../../theme/typography";

const PERIODS: { key: StatsPeriod; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

const WEEKDAY_LABELS_BY_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const weekdayLabelForDateKey = (dateKey: string): string =>
  WEEKDAY_LABELS_BY_DAY[new Date(`${dateKey}T00:00:00`).getDay()];

const StatsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { tasks, projects } = useTasks();
  const {
    logs,
    stats,
    getWeeklyActivity,
    getPeriodStats,
    formatPeriodDelta,
    getHeatmapActivity,
    getPersonalRecords,
    getFocusByProject,
    getRecentSessions,
    getTodayPomodoroCount,
    achievements,
  } = useStats();

  const [period, setPeriod] = useState<StatsPeriod>("week");
  // Memoize every aggregation on the log identity so a re-render (e.g. theme
  // toggle) doesn't recompute the 84-cell heatmap and period stats.
  const periodStats = useMemo(
    () => getPeriodStats(period),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logs, period]
  );
  const weeklyActivity = useMemo(
    () => getWeeklyActivity(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logs]
  );
  const records = useMemo(
    () => getPersonalRecords(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logs]
  );
  const heatmapActivity = useMemo(
    () => getHeatmapActivity(12),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logs]
  );
  const recentSessions = useMemo(
    () => getRecentSessions(15),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logs]
  );
  const todayCount = useMemo(
    () => getTodayPomodoroCount(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logs]
  );

  const projectStats = useMemo(
    () =>
      getFocusByProject((taskId) => {
        const task = tasks.find((item) => item.id === taskId);
        if (!task) {
          return null;
        }
        const project = projects.find((item) => item.id === task.projectId);
        return project
          ? { id: project.id, name: project.name }
          : { id: task.projectId, name: "Inbox" };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logs, tasks, projects]
  );

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
        hero: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          alignItems: "flex-start",
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
          ...cardElevation(isDark),
        },
        heroValue: {
          fontSize: 44,
          fontWeight: "700",
          color: colors.text,
          letterSpacing: 0.5,
          fontFamily: fontFamily.bold,
        },
        heroLabel: {
          fontSize: 14,
          color: colors.textMuted,
          marginTop: 4,
          fontFamily: fontFamily.regular,
        },
        section: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
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
          fontFamily: fontFamily.semiBold,
        },
        groupLabel: {
          ...typeScale.eyebrow,
          color: colors.textMuted,
          marginTop: 8,
          marginBottom: 8,
          paddingHorizontal: 4,
        },
        periodRow: {
          marginBottom: 2,
        },
        periodSummary: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 8,
        },
        periodMetric: {
          fontSize: 14,
          color: colors.text,
          fontFamily: fontFamily.regular,
        },
        periodDelta: {
          fontSize: 13,
          color: colors.textMuted,
          marginTop: 4,
          fontFamily: fontFamily.regular,
        },
        deltaUp: {
          color: colors.shortBreak,
        },
        deltaDown: {
          color: colors.danger,
        },
        deltaFlat: {
          color: colors.textMuted,
        },
        recordRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 8,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        recordLabel: {
          fontSize: 14,
          color: colors.textSecondary,
          fontFamily: fontFamily.regular,
        },
        recordValue: {
          fontSize: 14,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
          color: colors.text,
        },
        emptyHint: {
          fontSize: 14,
          color: colors.textMuted,
          textAlign: "center",
          paddingVertical: 12,
          fontFamily: fontFamily.regular,
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

  const deltaTone = (current: number, previous: number) => {
    if (current > previous) {
      return styles.deltaUp;
    }
    if (current < previous) {
      return styles.deltaDown;
    }
    return styles.deltaFlat;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle title="Stats" />

        <View
          style={styles.hero}
          accessibilityRole="text"
          accessibilityLabel={`${todayCount} pomodoros today, ${stats.currentStreak} day streak`}
        >
          <Text style={styles.heroValue}>{todayCount}</Text>
          <Text style={styles.heroLabel}>
            today · {stats.currentStreak}-day streak · best{" "}
            {stats.longestStreak}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Period overview</Text>
          <View style={styles.periodRow}>
            <Segmented
              options={PERIODS.map((item) => ({
                value: item.key,
                label: item.label,
              }))}
              value={period}
              onChange={setPeriod}
              accessibilityLabel="Stats period"
            />
          </View>
          <View style={styles.periodSummary}>
            <Text style={styles.periodMetric}>
              {periodStats.pomodoros} pomodoros · {periodStats.focusMinutes}m
            </Text>
          </View>
          <Text style={styles.periodDelta}>
            vs previous {period}:{" "}
            <Text
              style={deltaTone(
                periodStats.pomodoros,
                periodStats.previousPomodoros
              )}
            >
              {formatPeriodDelta(
                periodStats.pomodoros,
                periodStats.previousPomodoros
              )}
            </Text>{" "}
            sessions ·{" "}
            <Text
              style={deltaTone(
                periodStats.focusMinutes,
                periodStats.previousFocusMinutes
              )}
            >
              {formatPeriodDelta(
                periodStats.focusMinutes,
                periodStats.previousFocusMinutes
              )}
            </Text>{" "}
            focus time
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 7 days</Text>
          {stats.totalFocusSessions === 0 ? (
            <EmptyState
              title="No sessions yet"
              message="Complete a focus session to see your activity here."
            />
          ) : (
            <BarChart
              values={weeklyActivity.map((day) => day.pomodoros)}
              labels={weeklyActivity.map((day) =>
                weekdayLabelForDateKey(day.dateKey)
              )}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity heatmap</Text>
          <FocusHeatmap activity={heatmapActivity} weeks={12} />
        </View>

        <Text style={styles.groupLabel}>Details</Text>

        <CollapsibleSection title="Personal records">
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
        </CollapsibleSection>

        <CollapsibleSection title="Focus by project">
          <ProjectBreakdown data={projectStats} />
        </CollapsibleSection>

        <CollapsibleSection title="Recent sessions">
          <SessionTimeline
            sessions={recentSessions}
            resolveTaskTitle={resolveTaskTitle}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Achievements">
          <AchievementBadges achievements={achievements} />
        </CollapsibleSection>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatsScreen;
