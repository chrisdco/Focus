import React, { useEffect, useMemo, useState } from "react";
import {
  AppState,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DayTimeline } from "../../components/calendar/DayTimeline";
import { PlanTomorrowModal } from "../../components/calendar/PlanTomorrowModal";
import { ScheduleBlockModal } from "../../components/calendar/ScheduleBlockModal";
import { EmptyState } from "../../components/ui/EmptyState";
import { useSchedule } from "../../context/ScheduleContext";
import { useSettings } from "../../context/SettingsContext";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getBlocksForDate,
  getPlannedPomodoroCount,
  shiftDateKey,
} from "../../domain/schedule";
import { cardElevation } from "../../theme/shadows";
import type { ScheduleBlock } from "../../types/schedule";
import { toDateKey } from "../../utils/timer";

const CalendarScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { settings } = useSettings();
  const { tasks, planTasksForDate } = useTasks();
  const { blocks, upsertBlock, deleteBlock } = useSchedule();
  // Recompute "today" on every render + when returning to foreground so an
  // overnight-open app doesn't show stale plan counts.
  const [, setNowTick] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        setNowTick((v) => v + 1);
      }
    });
    return () => sub.remove();
  }, []);
  const todayKey = toDateKey(
    // eslint-disable-next-line react-hooks/purity -- must refresh each render + on foreground for overnight-open apps
    Date.now()
  );
  const [dateKey, setDateKey] = useState(todayKey);
  const [editorVisible, setEditorVisible] = useState(false);
  const [planVisible, setPlanVisible] = useState(false);
  const [editing, setEditing] = useState<ScheduleBlock | null>(null);

  const dayBlocks = getBlocksForDate(blocks, dateKey);
  const tomorrowKey = shiftDateKey(todayKey, 1);
  const planned = getPlannedPomodoroCount(
    tasks,
    blocks,
    dateKey,
    settings.focusDurationMinutes
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
        title: {
          fontSize: 28,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          marginBottom: 16,
        },
        nav: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        },
        navButton: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
        },
        navText: { color: colors.text, fontWeight: "600" },
        dateLabel: { color: colors.text, fontSize: 16, fontWeight: "600" },
        summary: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
          ...cardElevation(isDark),
        },
        summaryText: { color: colors.text, fontSize: 15, fontWeight: "600" },
        summaryMeta: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
        actions: { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" },
        action: {
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: colors.focus,
        },
        actionSecondary: {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border,
        },
        actionText: { color: colors.onPrimary, fontWeight: "600" },
        actionTextSecondary: { color: colors.text },
      }),
    [colors, isDark]
  );

  const openCreate = () => {
    setEditing(null);
    setEditorVisible(true);
  };

  const openEdit = (block: ScheduleBlock) => {
    setEditing(block);
    setEditorVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Calendar</Text>

        <View style={styles.nav}>
          <Pressable
            style={styles.navButton}
            onPress={() => setDateKey((value) => shiftDateKey(value, -1))}
            accessibilityRole="button"
            accessibilityLabel="Previous day"
          >
            <Text style={styles.navText}>Prev</Text>
          </Pressable>
          <Pressable onPress={() => setDateKey(todayKey)}>
            <Text style={styles.dateLabel}>
              {dateKey === todayKey ? `Today · ${dateKey}` : dateKey}
            </Text>
          </Pressable>
          <Pressable
            style={styles.navButton}
            onPress={() => setDateKey((value) => shiftDateKey(value, 1))}
            accessibilityRole="button"
            accessibilityLabel="Next day"
          >
            <Text style={styles.navText}>Next</Text>
          </Pressable>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {planned} planned pomodoro{planned === 1 ? "" : "s"}
          </Text>
          <Text style={styles.summaryMeta}>
            {dayBlocks.length} scheduled block{dayBlocks.length === 1 ? "" : "s"} · reminders
            5 min before focus
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.action} onPress={openCreate} accessibilityRole="button">
            <Text style={styles.actionText}>Add block</Text>
          </Pressable>
          <Pressable
            style={[styles.action, styles.actionSecondary]}
            onPress={() => setPlanVisible(true)}
            accessibilityRole="button"
          >
            <Text style={[styles.actionText, styles.actionTextSecondary]}>
              Plan tomorrow
            </Text>
          </Pressable>
        </View>

        {dayBlocks.length === 0 ? (
          <EmptyState
            title="No blocks this day"
            message="Add a focus block to see it on the timeline. Plan tomorrow to queue inbox tasks."
          />
        ) : null}

        <DayTimeline
          blocks={dayBlocks}
          resolveTaskTitle={(taskId) =>
            tasks.find((task) => task.id === taskId)?.title ?? null
          }
          onPressBlock={openEdit}
        />
      </ScrollView>

      <ScheduleBlockModal
        visible={editorVisible}
        dateKey={dateKey}
        tasks={tasks}
        initial={editing}
        defaultDurationMinutes={settings.focusDurationMinutes}
        onClose={() => setEditorVisible(false)}
        onSave={(draft, existingId) => upsertBlock(draft, existingId) !== null}
        onDelete={
          editing
            ? () => {
                deleteBlock(editing.id);
                setEditorVisible(false);
              }
            : undefined
        }
      />

      <PlanTomorrowModal
        visible={planVisible}
        tomorrowKey={tomorrowKey}
        tasks={tasks}
        onClose={() => setPlanVisible(false)}
        onConfirm={(taskIds) => planTasksForDate(taskIds, tomorrowKey)}
      />
    </SafeAreaView>
  );
};

export default CalendarScreen;
