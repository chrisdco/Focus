import { BottomSheet, RNHostView } from "@expo/ui";
import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import { type as typeScale } from "../../theme/typography";
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
        list: { flex: 1 },
        listContent: { paddingBottom: 24 },
        header: {
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
        },
        title: {
          ...typeScale.sheetTitle,
          color: colors.text,
        },
        row: {
          paddingVertical: 14,
          paddingHorizontal: 20,
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
          margin: 20,
          alignItems: "center",
          paddingVertical: 12,
        },
        clearText: {
          color: colors.danger,
          fontSize: 15,
        },
      }),
    [colors]
  );

  const selectTask = (task: Task) => {
    setActiveTaskId(task.id);
    onClose();
  };

  return (
    <BottomSheet
      isPresented={visible}
      onDismiss={onClose}
      snapPoints={["half", "full"]}
      containerColor={colors.surface}
      contentPadding={0}
    >
      <RNHostView>
        <FlatList
          style={styles.list}
          data={activeTasks}
          keyExtractor={(item) => item.id}
          nestedScrollEnabled
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Choose a task</Text>
            </View>
          }
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
            <Text style={[styles.rowMeta, { paddingHorizontal: 20 }]}>
              No active tasks. Add one from the Tasks tab.
            </Text>
          }
          ListFooterComponent={
            activeTaskId ? (
              <Pressable
                style={styles.clearButton}
                onPress={() => {
                  setActiveTaskId(null);
                  onClose();
                }}
              >
                <Text style={styles.clearText}>Clear active task</Text>
              </Pressable>
            ) : null
          }
        />
      </RNHostView>
    </BottomSheet>
  );
};
