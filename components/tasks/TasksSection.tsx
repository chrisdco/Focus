import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { TaskFormModal } from "./TaskFormModal";
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
import { cardElevation } from "../../theme/shadows";

const VIEWS: { key: TaskView; label: string }[] = [
  { key: "inbox", label: "Inbox" },
  { key: "today", label: "Today" },
  { key: "completed", label: "Completed" },
];

interface TasksSectionProps {
  /**
   * When true (tab usage) the section fills its parent and scrolls
   * internally. When false (composed screens like Plan) it sizes to
   * content and lets the parent scroll — FAB then anchors to the section.
   */
  scrollable?: boolean;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  scrollable = true,
}) => {
  const { colors, isDark } = useTheme();
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    getTasksForView,
    setActiveTaskId,
    createTask,
    updateTask,
    deleteTask,
    createProject,
  } = useTasks();

  const [view, setView] = useState<TaskView>("inbox");
  const [formVisible, setFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const tasks = getTasksForView(view);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
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
        addButton: {
          position: "absolute",
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.focus,
          alignItems: "center",
          justifyContent: "center",
          ...cardElevation(isDark),
        },
        addLabel: {
          color: colors.onPrimary,
          fontSize: 28,
          fontWeight: "400",
          fontFamily: fontFamily.regular,
          marginTop: -2,
        },
      }),
    [colors, isDark]
  );

  const openCreate = () => {
    setEditingTask(null);
    setFormVisible(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormVisible(true);
  };

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
            onPress={() => openEdit(item)}
            onStart={() => handleStart(item)}
          />
        ))
      )}
    </>
  );

  return (
    <View style={scrollable ? styles.root : undefined}>
      {scrollable ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        // Clearance for the anchored FAB; the parent scrolls.
        <View style={{ paddingBottom: 88 }}>{content}</View>
      )}

      <Pressable
        style={styles.addButton}
        onPress={openCreate}
        accessibilityRole="button"
        accessibilityLabel="Add task"
      >
        <Text style={styles.addLabel}>+</Text>
      </Pressable>

      <TaskFormModal
        visible={formVisible}
        projects={projects}
        initialTask={editingTask}
        onClose={() => setFormVisible(false)}
        onCreateProject={createProject}
        onSave={(draft) => {
          if (editingTask) {
            updateTask(editingTask.id, draft);
          } else {
            createTask(draft);
          }
        }}
        onDelete={
          editingTask ? () => deleteTask(editingTask.id) : undefined
        }
      />
    </View>
  );
};
