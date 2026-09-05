import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { TaskFormModal } from "../../components/tasks/TaskFormModal";
import { TaskRow } from "../../components/tasks/TaskRow";
import { QuickAdd } from "../../components/tasks/QuickAdd";
import { EmptyState } from "../../components/ui/EmptyState";
import { ScreenTitle } from "../../components/ui/ScreenTitle";
import { Segmented } from "../../components/ui/Segmented";
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

const TasksScreen: React.FC = () => {
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
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 16,
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <ScreenTitle title="Tasks" />

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
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
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
              <Text style={{ color: project.color, fontSize: 13 }}>
                {project.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskRow
              task={item}
              project={getProject(item.projectId)}
              onPress={() => openEdit(item)}
              onStart={() => handleStart(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={view === "completed" ? "No completed tasks" : "No tasks yet"}
              message={
                view === "completed"
                  ? "Finished tasks will show up here."
                  : "Add a task, then start it from here or from the timer."
              }
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

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
    </SafeAreaView>
  );
};

export default TasksScreen;
