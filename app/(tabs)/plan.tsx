import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CalendarSection } from "../../components/calendar/CalendarSection";
import { TaskFormModal } from "../../components/tasks/TaskFormModal";
import { TasksSection } from "../../components/tasks/TasksSection";
import { ScreenTitle } from "../../components/ui/ScreenTitle";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import { fontFamily } from "../../theme/fonts";
import { cardElevation } from "../../theme/shadows";
import { type as typeScale } from "../../theme/typography";
import type { Task } from "../../types/task";

/**
 * Agenda-first planning: tasks on top, schedule below, one shared scroll.
 * Composes the same section components the old tabs rendered — no forks.
 * The FAB is screen-anchored here so it never floats mid-content.
 */
const PlanScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const {
    projects,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    createProject,
  } = useTasks();

  const [formVisible, setFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        root: { flex: 1 },
        container: {
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32,
        },
        groupLabel: {
          ...typeScale.eyebrow,
          color: colors.textMuted,
          marginTop: 8,
          marginBottom: 8,
          paddingHorizontal: 4,
        },
        scheduleGap: {
          marginTop: 16,
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.root}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle title="Plan" />

          <Text style={styles.groupLabel}>Tasks</Text>
          <TasksSection onEditTask={openEdit} />

          <View style={styles.scheduleGap}>
            <Text style={styles.groupLabel}>Schedule</Text>
            <CalendarSection />
          </View>
        </ScrollView>

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
          onToggleStatus={
            editingTask
              ? () => {
                  if (editingTask.status === "completed") {
                    updateTask(editingTask.id, { status: "active" });
                  } else {
                    completeTask(editingTask.id);
                  }
                }
              : undefined
          }
          onDelete={
            editingTask ? () => deleteTask(editingTask.id) : undefined
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default PlanScreen;
