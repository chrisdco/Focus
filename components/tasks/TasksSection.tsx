import React, { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { TaskRow } from "./TaskRow";
import { QuickAdd } from "./QuickAdd";
import { EmptyState } from "../ui/EmptyState";
import { Segmented } from "../ui/Segmented";
import { fontFamily } from "../../theme/fonts";
import { createEmptyTaskDraft } from "../../types/task";
import { toDateKey } from "../../utils/timer";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import type { Task, TaskView } from "../../types/task";

const VIEWS: { key: TaskView; label: string }[] = [
  { key: "inbox", label: "Inbox" },
  { key: "today", label: "Today" },
  { key: "completed", label: "Completed" },
];

interface TasksSectionProps {
  /** Edit an existing task. */
  onEditTask: (task: Task) => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  onEditTask,
}) => {
  const { colors } = useTheme();
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    getTasksForView,
    setActiveTaskId,
    createTask,
  } = useTasks();

  const [view, setView] = useState<TaskView>("inbox");

  const tasks = getTasksForView(view);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        projectRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        },
        projectChip: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
        },
        empty: {
          textAlign: "center",
          color: colors.textMuted,
          marginTop: 48,
          fontSize: 15,
          lineHeight: 22,
          paddingHorizontal: 24,
          fontFamily: fontFamily.regular,
        },
      }),
    [colors]
  );

  const handleStart = (task: Task) => {
    setActiveTaskId(task.id);
    router.push("/(tabs)");
  };

  const getProject = (projectId: string) =>
    projects.find((project) => project.id === projectId);

  const content = (
    <>
      <QuickAdd
        onAdd={(title, estimatedPomodoros) =>
          createTask({
            ...createEmptyTaskDraft(selectedProjectId ?? undefined),
            title,
            estimatedPomodoros,
            // Stamp current day for today-view captures.
            ...(view === "today" ? { dueDate: toDateKey(Date.now()) } : {}),
          })
        }
      />

      <Segmented
        options={VIEWS.map((item) => ({ value: item.key, label: item.label }))}
        value={view}
        onChange={setView}
        accessibilityLabel="Task view"
      />

      <View style={styles.projectRow}>
        <Pressable
          style={[
            styles.projectChip,
            selectedProjectId === null && {
              borderColor: colors.focus,
              backgroundColor: `${colors.focus}18`,
            },
          ]}
          onPress={() => setSelectedProjectId(null)}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedProjectId === null }}
          accessibilityLabel="All projects"
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              fontFamily: fontFamily.regular,
            }}
          >
            All
          </Text>
        </Pressable>
        {projects.map((project) => (
            <Pressable
              key={project.id}
              style={[
                styles.projectChip,
                selectedProjectId === project.id && {
                  borderColor: project.color,
                  backgroundColor: `${project.color}18`,
                },
              ]}
              onPress={() => setSelectedProjectId(project.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedProjectId === project.id }}
              accessibilityLabel={`Project ${project.name}`}
            >
            <Text
              style={{
                color: project.color,
                fontSize: 13,
                fontFamily: fontFamily.regular,
              }}
            >
              {project.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {tasks.length === 0 ? (
        <EmptyState
          title={view === "completed" ? "No completed tasks" : "No tasks yet"}
          message={
            view === "completed"
              ? "Finished tasks will show up here."
              : "Add a task, then start it from here or from the timer."
          }
        />
      ) : (
        tasks.map((item) => (
          <TaskRow
            key={item.id}
            task={item}
            project={getProject(item.projectId)}
            onPress={() => onEditTask(item)}
            onStart={() => handleStart(item)}
          />
        ))
      )}
    </>
  );

  return <>{content}</>;
};
