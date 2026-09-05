import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

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
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["70%"], []);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

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
    sheetRef.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
    >
      <BottomSheetView style={styles.header}>
        <Text style={styles.title}>Choose a task</Text>
      </BottomSheetView>
      <BottomSheetFlatList
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
                sheetRef.current?.dismiss();
              }}
            >
              <Text style={styles.clearText}>Clear active task</Text>
            </Pressable>
          ) : null
        }
      />
    </BottomSheetModal>
  );
};
