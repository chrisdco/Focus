import { BottomSheet, RNHostView } from "@expo/ui";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { fontFamily } from "../../theme/fonts";
import { formatClock, parseClock } from "../../domain/schedule";
import { type as typeScale } from "../../theme/typography";
import type {
  ScheduleBlock,
  ScheduleBlockDraft,
  ScheduleBlockKind,
} from "../../types/schedule";
import type { Task } from "../../types/task";

const KINDS: { key: ScheduleBlockKind; label: string }[] = [
  { key: "focus", label: "Focus" },
  { key: "shortBreak", label: "Short break" },
  { key: "longBreak", label: "Long break" },
];

interface ScheduleBlockModalProps {
  visible: boolean;
  dateKey: string;
  tasks: Task[];
  initial?: ScheduleBlock | null;
  defaultDurationMinutes: number;
  onClose: () => void;
  onSave: (draft: ScheduleBlockDraft, existingId?: string) => boolean;
  onDelete?: () => void;
}

export const ScheduleBlockModal: React.FC<ScheduleBlockModalProps> = ({
  visible,
  dateKey,
  tasks,
  initial,
  defaultDurationMinutes,
  onClose,
  onSave,
  onDelete,
}) => {
  const { colors } = useTheme();
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [duration, setDuration] = useState(defaultDurationMinutes);
  const [kind, setKind] = useState<ScheduleBlockKind>("focus");
  const [taskId, setTaskId] = useState<string | null>(null);

  // Sync draft immediately on open (no setTimeout) to avoid one frame of
  // stale values from the previous edit.
  useEffect(() => {
    if (!visible) {
      return;
    }

    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional draft reset on open
      setHour(Math.floor(initial.startMinutes / 60));
      setMinute(initial.startMinutes % 60);
      setDuration(initial.durationMinutes);
      setKind(initial.kind);
      setTaskId(initial.taskId);
      return;
    }

    setHour(9);
    setMinute(0);
    setDuration(defaultDurationMinutes);
    setKind("focus");
    setTaskId(null);
  }, [visible, initial, defaultDurationMinutes]);

  const shiftMinutes = (delta: number) => {
    const total = Math.max(
      0,
      Math.min(23 * 60 + 59, hour * 60 + minute + delta)
    );
    setHour(Math.floor(total / 60));
    setMinute(total % 60);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          flex: 1,
        },
        content: {
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 32,
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        },
        headerPad: {
          paddingHorizontal: 20,
          paddingTop: 8,
        },
        title: {
          ...typeScale.sheetTitle,
          color: colors.text,
        },
        close: {
          color: colors.textMuted,
          fontSize: 16,
          fontFamily: fontFamily.regular,
        },
        label: {
          fontSize: 14,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
          color: colors.textMuted,
          marginBottom: 8,
          marginTop: 12,
        },
        row: { flexDirection: "row", alignItems: "center", gap: 12 },
        stepper: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.track,
          alignItems: "center",
          justifyContent: "center",
        },
        stepperText: {
          fontSize: 20,
          color: colors.text,
          fontFamily: fontFamily.regular,
        },
        value: {
          fontSize: 16,
          color: colors.text,
          minWidth: 72,
          textAlign: "center",
          fontFamily: fontFamily.regular,
        },
        chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        chip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipActive: {
          backgroundColor: colors.focus,
          borderColor: colors.focus,
        },
        chipText: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
        },
        chipTextActive: { color: colors.onPrimary },
        save: {
          marginTop: 20,
          backgroundColor: colors.focus,
          borderRadius: 12,
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
        },
        saveText: {
          color: colors.onPrimary,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
          fontSize: 16,
        },
        delete: { marginTop: 12, alignItems: "center", minHeight: 44, justifyContent: "center" },
        deleteText: {
          color: colors.danger,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
        },
      }),
    [colors]
  );

  const handleSave = () => {
    const ok = onSave(
      {
        dateKey,
        startMinutes: parseClock(hour, minute),
        durationMinutes: duration,
        kind,
        taskId: kind === "focus" ? taskId : null,
      },
      initial?.id
    );

    if (!ok) {
      Alert.alert("Overlaps another block", "Choose a different start time.");
      return;
    }

    onClose();
  };

  const activeTasks = tasks.filter((task) => task.status === "active");

  return (
    <BottomSheet
      isPresented={visible}
      onDismiss={onClose}
      snapPoints={["half", "full"]}
      containerColor={colors.surface}
      contentPadding={0}
    >
      <RNHostView>
        <>
          <View style={[styles.header, styles.headerPad]}>
            <Text style={styles.title}>
              {initial ? "Edit block" : "Schedule block"}
            </Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Start</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.stepper}
                onPress={() => setHour((value) => Math.max(0, value - 1))}
              >
                <Text style={styles.stepperText}>−</Text>
              </Pressable>
              <Text style={styles.value}>{formatClock(parseClock(hour, minute))}</Text>
              <Pressable
                style={styles.stepper}
                onPress={() => setHour((value) => Math.min(23, value + 1))}
              >
                <Text style={styles.stepperText}>+</Text>
              </Pressable>
              <Pressable
                style={styles.stepper}
                onPress={() => shiftMinutes(-5)}
                accessibilityRole="button"
                accessibilityLabel="Minus 5 minutes"
              >
                <Text style={styles.stepperText}>−5</Text>
              </Pressable>
              <Pressable
                style={styles.stepper}
                onPress={() => shiftMinutes(5)}
                accessibilityRole="button"
                accessibilityLabel="Plus 5 minutes"
              >
                <Text style={styles.stepperText}>+5</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Duration</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.stepper}
                onPress={() => setDuration((value) => Math.max(5, value - 5))}
              >
                <Text style={styles.stepperText}>−</Text>
              </Pressable>
              <Text style={styles.value}>{duration} min</Text>
              <Pressable
                style={styles.stepper}
                onPress={() => setDuration((value) => Math.min(180, value + 5))}
              >
                <Text style={styles.stepperText}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {KINDS.map((item) => {
                const active = kind === item.key;
                return (
                  <Pressable
                    key={item.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setKind(item.key)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {kind === "focus" && (
              <>
                <Text style={styles.label}>Task (optional)</Text>
                <View style={styles.chipRow}>
                  <Pressable
                    style={[styles.chip, taskId === null && styles.chipActive]}
                    onPress={() => setTaskId(null)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        taskId === null && styles.chipTextActive,
                      ]}
                    >
                      None
                    </Text>
                  </Pressable>
                  {activeTasks.map((task) => {
                    const active = taskId === task.id;
                    return (
                      <Pressable
                        key={task.id}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setTaskId(task.id)}
                      >
                        <Text
                          style={[styles.chipText, active && styles.chipTextActive]}
                        >
                          {task.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <Pressable style={styles.save} onPress={handleSave} accessibilityRole="button">
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
            {onDelete && (
              <Pressable style={styles.delete} onPress={onDelete} accessibilityRole="button">
                <Text style={styles.deleteText}>Delete block</Text>
              </Pressable>
            )}
          </ScrollView>
        </>
      </RNHostView>
    </BottomSheet>
  );
};
