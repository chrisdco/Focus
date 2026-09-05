import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { cardElevation } from "../../theme/shadows";
import { type as typeScale } from "../../theme/typography";
import type { Task } from "../../types/task";

interface PlanTomorrowModalProps {
  visible: boolean;
  tomorrowKey: string;
  tasks: Task[];
  onClose: () => void;
  onConfirm: (taskIds: string[]) => void;
}

export const PlanTomorrowModal: React.FC<PlanTomorrowModalProps> = ({
  visible,
  tomorrowKey,
  tasks,
  onClose,
  onConfirm,
}) => {
  const { colors, isDark } = useTheme();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Include inbox + overdue + already-due-tomorrow tasks so tomorrow-due
  // items aren't hidden; pre-check the already-planned ones.
  const inbox = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status === "active" &&
          (task.dueDate === null || task.dueDate <= tomorrowKey)
      ),
    [tasks, tomorrowKey]
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset + pre-check on open
    setSelected(
      new Set(
        tasks
          .filter(
            (task) => task.status === "active" && task.dueDate === tomorrowKey
          )
          .map((task) => task.id)
      )
    );
  }, [visible, tasks, tomorrowKey]);

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
          padding: 20,
          paddingBottom: 32,
          maxHeight: "80%",
          borderWidth: 1,
          borderColor: colors.border,
          ...cardElevation(isDark),
        },
        title: {
          ...typeScale.sheetTitle,
          color: colors.text,
          marginBottom: 8,
        },
        hint: {
          fontSize: 14,
          color: colors.textMuted,
          marginBottom: 16,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 12,
        },
        check: {
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: colors.border,
        },
        checkOn: {
          backgroundColor: colors.focus,
          borderColor: colors.focus,
        },
        taskTitle: { flex: 1, color: colors.text, fontSize: 16 },
        meta: { color: colors.textMuted, fontSize: 13 },
        save: {
          marginTop: 16,
          backgroundColor: colors.focus,
          borderRadius: 12,
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
        },
        saveText: { color: colors.onPrimary, fontWeight: "600", fontSize: 16 },
        empty: { color: colors.textMuted, textAlign: "center", paddingVertical: 24 },
      }),
    [colors, isDark]
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Plan tomorrow</Text>
          <Text style={styles.hint}>
            Choose inbox tasks to schedule for {tomorrowKey}. They will show on
            the timer as today&apos;s plan tomorrow morning.
          </Text>
          <ScrollView>
            {inbox.length === 0 ? (
              <Text style={styles.empty}>No inbox tasks to plan.</Text>
            ) : (
              inbox.map((task) => {
                const on = selected.has(task.id);
                return (
                  <Pressable
                    key={task.id}
                    style={styles.row}
                    onPress={() => toggle(task.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                  >
                    <View style={[styles.check, on && styles.checkOn]} />
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.meta}>{task.estimatedPomodoros}p</Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
          <Pressable
            style={styles.save}
            onPress={() => {
              onConfirm([...selected]);
              onClose();
            }}
            accessibilityRole="button"
          >
            <Text style={styles.saveText}>
              Plan {selected.size} task{selected.size === 1 ? "" : "s"}
            </Text>
          </Pressable>
          <Pressable onPress={onClose} style={{ alignItems: "center", marginTop: 12 }}>
            <Text style={{ color: colors.textMuted }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
