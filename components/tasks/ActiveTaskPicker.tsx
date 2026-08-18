import React, { useMemo } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import type { Task } from "../../types/task";

interface ActiveTaskPickerProps {
  visible: boolean;
  onClose: () => void;
}

export const ActiveTaskPicker: React.FC<ActiveTaskPickerProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const { getTasksForView, setActiveTaskId, activeTaskId } = useTasks();

  const activeTasks = [
    ...getTasksForView("today"),
    ...getTasksForView("inbox"),
  ].filter(
    (task, index, array) =>
      array.findIndex((item) => item.id === task.id) === index
  );

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
          maxHeight: "70%",
          borderWidth: 1,
          borderColor: colors.border,
        },
        title: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 12,
        },
        row: {
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        rowTitle: {
          fontSize: 16,
          color: colors.text,
        },
        rowMeta: {
          fontSize: 13,
          color: colors.textMuted,
          marginTop: 4,
        },
        clearButton: {
          marginTop: 12,
          alignItems: "center",
          paddingVertical: 12,
        },
        clearText: {
          color: colors.danger,
          fontSize: 15,
        },
        close: {
          color: colors.textMuted,
          marginBottom: 8,
          textAlign: "right",
        },
      }),
    [colors]
  );

  const selectTask = (task: Task) => {
    setActiveTaskId(task.id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
          <Text style={styles.title}>Choose a task</Text>

          <FlatList
            data={activeTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => selectTask(item)}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowMeta}>
                  🍅 {item.completedPomodoros}/{item.estimatedPomodoros}
                  {activeTaskId === item.id ? " • Active" : ""}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.rowMeta}>
                No active tasks. Add one from the Tasks tab.
              </Text>
            }
          />

          {activeTaskId && (
            <Pressable
              style={styles.clearButton}
              onPress={() => {
                setActiveTaskId(null);
                onClose();
              }}
            >
              <Text style={styles.clearText}>Clear active task</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};
