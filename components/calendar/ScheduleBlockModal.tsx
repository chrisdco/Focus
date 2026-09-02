import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { formatClock, parseClock } from "../../domain/schedule";
import { cardElevation } from "../../theme/shadows";
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
  const { colors, isDark } = useTheme();
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [duration, setDuration] = useState(defaultDurationMinutes);
  const [kind, setKind] = useState<ScheduleBlockKind>("focus");
  const [taskId, setTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = setTimeout(() => {
      if (initial) {
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
    }, 0);

    return () => clearTimeout(timer);
  }, [visible, initial, defaultDurationMinutes]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: colors.overlay,
        },
        sheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32,
          maxHeight: "90%",
          borderWidth: 1,
          borderColor: colors.border,
          ...cardElevation(isDark),
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 12,
        },
        title: {
          fontSize: 20,
          fontWeight: "700",
          color: colors.text,
        },
        close: { color: colors.textMuted, fontSize: 16 },
        label: {
          fontSize: 14,
          fontWeight: "600",
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
        stepperText: { fontSize: 20, color: colors.text },
        value: { fontSize: 16, color: colors.text, minWidth: 72, textAlign: "center" },
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
        chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
        chipTextActive: { color: colors.onPrimary },
        save: {
          marginTop: 20,
          backgroundColor: colors.focus,
          borderRadius: 12,
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
        },
        saveText: { color: colors.onPrimary, fontWeight: "600", fontSize: 16 },
        delete: { marginTop: 12, alignItems: "center", minHeight: 44, justifyContent: "center" },
        deleteText: { color: colors.danger, fontWeight: "600" },
      }),
    [colors, isDark]
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {initial ? "Edit block" : "Schedule block"}
            </Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
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
                onPress={() => setMinute((value) => (value + 55) % 60)}
              >
                <Text style={styles.stepperText}>−5</Text>
              </Pressable>
              <Pressable
                style={styles.stepper}
                onPress={() => setMinute((value) => (value + 5) % 60)}
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
        </View>
      </View>
    </Modal>
  );
};
