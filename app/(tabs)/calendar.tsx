import React, { useEffect, useMemo, useState } from "react";
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DayTimeline } from "../../components/calendar/DayTimeline";
import { MonthGrid } from "../../components/calendar/MonthGrid";
import { PlanTomorrowModal } from "../../components/calendar/PlanTomorrowModal";
import { ScheduleBlockModal } from "../../components/calendar/ScheduleBlockModal";
import { EmptyState } from "../../components/ui/EmptyState";
import { ScreenTitle } from "../../components/ui/ScreenTitle";
import { Segmented } from "../../components/ui/Segmented";
import { useSchedule } from "../../context/ScheduleContext";
import { useSettings } from "../../context/SettingsContext";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import {
  addMonths,
  countBlocksByDate,
  formatClock,
  getBlocksForDate,
  getPlannedPomodoroCount,
  kindLabel,
  monthLabel,
  shiftDateKey,
  yearMonthOf,
} from "../../domain/schedule";
import { fontFamily } from "../../theme/fonts";
import type { ScheduleBlock } from "../../types/schedule";
import { toDateKey } from "../../utils/timer";

type CalendarView = "day" | "month";

const CalendarScreen: React.FC = () => {
  const { colors } = useTheme();
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
  const [view, setView] = useState<CalendarView>("day");
  const [monthNav, setMonthNav] = useState(() => yearMonthOf(todayKey));
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
  const monthCounts = useMemo(
    () => countBlocksByDate(blocks, monthNav.year, monthNav.month),
    [blocks, monthNav]
  );

  const selectMonthDay = (key: string) => {
    setDateKey(key);
    setMonthNav(yearMonthOf(key));
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
        nav: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        },
        agendaTitle: {
          fontSize: 17,
          fontWeight: "600",
          color: colors.text,
          marginTop: 12,
          marginBottom: 8,
          fontFamily: fontFamily.semiBold,
        },
        agendaRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
        },
        agendaText: {
          fontSize: 15,
          color: colors.text,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
        },
        agendaMeta: {
          fontSize: 13,
          color: colors.textMuted,
          marginTop: 2,
          fontFamily: fontFamily.regular,
        },
        navButton: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
        },
        navText: {
          color: colors.text,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
        },
        dateLabel: {
          color: colors.text,
          fontSize: 16,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
        },
        summary: {
          marginBottom: 12,
        },
        summaryText: {
          color: colors.text,
          fontSize: 15,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
        },
        summaryMeta: {
          color: colors.textMuted,
          marginTop: 4,
          fontSize: 13,
          fontFamily: fontFamily.regular,
        },
        actions: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
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
        actionText: {
          color: colors.onPrimary,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
        },
        actionTextSecondary: { color: colors.text, fontFamily: fontFamily.regular },
      }),
    [colors]
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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="Calendar" />

        <Segmented
          options={[
            { value: "day", label: "Day" },
            { value: "month", label: "Month" },
          ]}
          value={view}
          onChange={setView}
          accessibilityLabel="Calendar view"
        />

        {view === "day" ? (
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
        ) : (
          <>
            <View style={styles.nav}>
              <Pressable
                style={styles.navButton}
                onPress={() =>
                  setMonthNav((value) => addMonths(value.year, value.month, -1))
                }
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <Text style={styles.navText}>‹</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setMonthNav(yearMonthOf(todayKey));
                  setDateKey(todayKey);
                }}
                accessibilityRole="button"
                accessibilityLabel="Jump to current month"
              >
                <Text style={styles.dateLabel}>
                  {monthLabel(monthNav.year, monthNav.month)} ›
                </Text>
              </Pressable>
              <Pressable
                style={styles.navButton}
                onPress={() =>
                  setMonthNav((value) => addMonths(value.year, value.month, 1))
                }
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <Text style={styles.navText}>›</Text>
              </Pressable>
            </View>
            <View style={styles.nav}>
              <Pressable
                style={styles.navButton}
                onPress={() =>
                  setMonthNav((value) => ({ year: value.year - 1, month: value.month }))
                }
                accessibilityRole="button"
                accessibilityLabel="Previous year"
              >
                <Text style={styles.navText}>‹ {monthNav.year - 1}</Text>
              </Pressable>
              <Pressable
                style={styles.navButton}
                onPress={() => {
                  setMonthNav(yearMonthOf(todayKey));
                  setDateKey(todayKey);
                }}
                accessibilityRole="button"
                accessibilityLabel="Go to today"
              >
                <Text style={styles.navText}>Today</Text>
              </Pressable>
              <Pressable
                style={styles.navButton}
                onPress={() =>
                  setMonthNav((value) => ({ year: value.year + 1, month: value.month }))
                }
                accessibilityRole="button"
                accessibilityLabel="Next year"
              >
                <Text style={styles.navText}>{monthNav.year + 1} ›</Text>
              </Pressable>
            </View>
          </>
        )}

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

        {dayBlocks.length === 0 && view === "day" ? (
          <EmptyState
            title="No blocks this day"
            message="Add a focus block to see it on the timeline. Plan tomorrow to queue inbox tasks."
          />
        ) : null}

        {view === "day" ? (
          <DayTimeline
            blocks={dayBlocks}
            resolveTaskTitle={(taskId) =>
              tasks.find((task) => task.id === taskId)?.title ?? null
            }
            onPressBlock={openEdit}
          />
        ) : (
          <>
            <MonthGrid
              year={monthNav.year}
              month={monthNav.month}
              counts={monthCounts}
              selectedKey={dateKey}
              todayKey={todayKey}
              onSelect={selectMonthDay}
            />
            <Text style={styles.agendaTitle}>
              {dateKey === todayKey ? "Today" : dateKey} · {dayBlocks.length}{" "}
              block{dayBlocks.length === 1 ? "" : "s"}
            </Text>
            {dayBlocks.length === 0 ? (
              <EmptyState
                title="Nothing scheduled"
                message="Pick another day or add a focus block here."
              />
            ) : (
              dayBlocks.map((block) => (
                <Pressable
                  key={block.id}
                  style={styles.agendaRow}
                  onPress={() => openEdit(block)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit block at ${formatClock(block.startMinutes)}`}
                >
                  <View>
                    <Text style={styles.agendaText}>
                      {tasks.find((task) => task.id === block.taskId)?.title ??
                        kindLabel(block.kind)}
                    </Text>
                    <Text style={styles.agendaMeta}>
                      {formatClock(block.startMinutes)} · {block.durationMinutes}m
                    </Text>
                  </View>
                  <Text style={styles.agendaMeta}>Edit</Text>
                </Pressable>
              ))
            )}
          </>
        )}
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
