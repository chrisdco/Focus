import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import type { Project, Task } from "../../types/task";
import { PRIORITY_COLORS } from "../../types/task";

interface TaskRowProps {
  task: Task;
  project?: Project;
  onPress: () => void;
  onStart: () => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  project,
  onPress,
  onStart,
}) => {
  const { colors } = useTheme();
  const progress = `${task.completedPomodoros}/${task.estimatedPomodoros}`;

  return (
    <Pressable
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${progress} pomodoros`}
    >
      <View
        style={[
          styles.priorityDot,
          { backgroundColor: PRIORITY_COLORS[task.priority] },
        ]}
      />

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            🍅 {progress}
          </Text>
          {project && (
            <Text style={[styles.meta, { color: project.color }]}>
              {project.name}
            </Text>
          )}
          {task.dueDate && (
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              Due {task.dueDate}
            </Text>
          )}
        </View>
      </View>

      {task.status === "active" && (
        <Pressable
          style={[styles.startButton, { backgroundColor: colors.focus }]}
          onPress={(event) => {
            event.stopPropagation();
            onStart();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Start timer for ${task.title}`}
        >
          <Text style={[styles.startLabel, { color: colors.onPrimary }]}>
            Start
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  meta: {
    fontSize: 13,
  },
  startButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  startLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
