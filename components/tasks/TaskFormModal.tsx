import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "../../context/ThemeContext";
import type { Project, Task, TaskDraft, TaskPriority } from "../../types/task";
import { createEmptyTaskDraft } from "../../types/task";
import { toDateKey } from "../../utils/timer";

const PROJECT_COLORS = [
  "#4F46E5",
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
];

interface TaskFormModalProps {
  visible: boolean;
  projects: Project[];
  initialTask?: Task | null;
  onClose: () => void;
  onSave: (draft: TaskDraft) => void;
  onDelete?: () => void;
  onCreateProject: (name: string, color: string) => Project;
}

const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  projects,
  initialTask,
  onClose,
  onSave,
  onDelete,
  onCreateProject,
}) => {
  const { colors, isDark } = useTheme();
  const [draft, setDraft] = useState<TaskDraft>(createEmptyTaskDraft());
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (initialTask) {
      setDraft({
        title: initialTask.title,
        notes: initialTask.notes,
        projectId: initialTask.projectId,
        estimatedPomodoros: initialTask.estimatedPomodoros,
        priority: initialTask.priority,
        dueDate: initialTask.dueDate,
        tags: initialTask.tags,
      });
      setTagsInput(initialTask.tags.join(", "));
    } else {
      setDraft(createEmptyTaskDraft());
      setTagsInput("");
    }
  }, [visible, initialTask]);

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
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        },
        title: {
          fontSize: 20,
          fontWeight: "700",
          color: colors.text,
        },
        close: {
          color: colors.textMuted,
          fontSize: 16,
        },
        label: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textMuted,
          marginBottom: 8,
          marginTop: 12,
        },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.text,
          backgroundColor: isDark ? colors.background : colors.surface,
        },
        notesInput: {
          minHeight: 80,
          textAlignVertical: "top",
        },
        chipRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        },
        chip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipText: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        stepperRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
        },
        stepperButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.track,
          alignItems: "center",
          justifyContent: "center",
        },
        stepperButtonText: {
          fontSize: 20,
          color: colors.text,
        },
        saveButton: {
          marginTop: 20,
          backgroundColor: colors.focus,
          borderRadius: 12,
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
        },
        saveButtonText: {
          color: colors.onPrimary,
          fontSize: 16,
          fontWeight: "600",
        },
        deleteButton: {
          marginTop: 12,
          alignItems: "center",
          minHeight: 44,
          justifyContent: "center",
        },
        deleteButtonText: {
          color: colors.danger,
          fontSize: 15,
          fontWeight: "600",
        },
      }),
    [colors, isDark]
  );

  const handleSave = () => {
    if (!draft.title.trim()) {
      Alert.alert("Title required", "Please enter a task title.");
      return;
    }

    onSave({
      ...draft,
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    onClose();
  };

  const todayKey = toDateKey(Date.now());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toDateKey(tomorrow.getTime());

  const isDueActive = (option: "none" | "today" | "tomorrow"): boolean => {
    if (option === "none") {
      return draft.dueDate === null;
    }
    if (option === "today") {
      return draft.dueDate === todayKey;
    }
    return draft.dueDate === tomorrowKey;
  };
  const setDue = (option: "none" | "today" | "tomorrow") => {
    if (option === "none") {
      setDraft((prev) => ({ ...prev, dueDate: null }));
      return;
    }
    if (option === "today") {
      setDraft((prev) => ({ ...prev, dueDate: todayKey }));
      return;
    }
    setDraft((prev) => ({ ...prev, dueDate: tomorrowKey }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>
                {initialTask ? "Edit task" : "New task"}
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={draft.title}
              onChangeText={(title) => setDraft((prev) => ({ ...prev, title }))}
              placeholder="What are you working on?"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={draft.notes}
              onChangeText={(notes) => setDraft((prev) => ({ ...prev, notes }))}
              placeholder="Optional details"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <Text style={styles.label}>Estimated pomodoros</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperButton}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    estimatedPomodoros: Math.max(1, prev.estimatedPomodoros - 1),
                  }))
                }
              >
                <Text style={styles.stepperButtonText}>−</Text>
              </Pressable>
              <Text style={{ color: colors.text, fontSize: 18 }}>
                {draft.estimatedPomodoros}
              </Text>
              <Pressable
                style={styles.stepperButton}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    estimatedPomodoros: prev.estimatedPomodoros + 1,
                  }))
                }
              >
                <Text style={styles.stepperButtonText}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map((priority) => (
                <Pressable
                  key={priority}
                  style={[
                    styles.chip,
                    draft.priority === priority && {
                      borderColor: colors.focus,
                      backgroundColor: `${colors.focus}22`,
                    },
                  ]}
                  onPress={() => setDraft((prev) => ({ ...prev, priority }))}
                >
                  <Text style={styles.chipText}>{priority}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Due date</Text>
            <View style={styles.chipRow}>
              {(["none", "today", "tomorrow"] as const).map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.chip,
                    isDueActive(option) && {
                      borderColor: colors.focus,
                      backgroundColor: `${colors.focus}22`,
                    },
                  ]}
                  onPress={() => setDue(option)}
                >
                  <Text style={styles.chipText}>
                    {option === "none" ? "No date" : option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Project</Text>
            <View style={styles.chipRow}>
              {projects.map((project) => (
                <Pressable
                  key={project.id}
                  style={[
                    styles.chip,
                    draft.projectId === project.id && {
                      borderColor: project.color,
                    },
                  ]}
                  onPress={() =>
                    setDraft((prev) => ({ ...prev, projectId: project.id }))
                  }
                >
                  <Text style={[styles.chipText, { color: project.color }]}>
                    {project.name}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={styles.chip}
                onPress={() => {
                  const color =
                    PROJECT_COLORS[projects.length % PROJECT_COLORS.length];
                  const project = onCreateProject("New project", color);
                  setDraft((prev) => ({ ...prev, projectId: project.id }));
                }}
              >
                <Text style={styles.chipText}>+ Project</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              value={tagsInput}
              onChangeText={setTagsInput}
              placeholder="design, urgent"
              placeholderTextColor={colors.textMuted}
            />

            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save task</Text>
            </Pressable>

            {initialTask && onDelete && (
              <Pressable
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert("Delete task", "This cannot be undone.", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => {
                        onDelete();
                        onClose();
                      },
                    },
                  ]);
                }}
              >
                <Text style={styles.deleteButtonText}>Delete task</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
