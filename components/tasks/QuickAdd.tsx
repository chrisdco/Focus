import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";

interface QuickAddProps {
  onAdd: (title: string, estimatedPomodoros: number) => void;
}

/** Capture a task in under 5 seconds without opening the modal. */
export const QuickAdd: React.FC<QuickAddProps> = ({ onAdd }) => {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [estimate, setEstimate] = useState(1);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: colors.surface,
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
        },
        input: {
          flex: 1,
          fontSize: 16,
          color: colors.text,
          minHeight: 40,
        },
        stepper: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        stepButton: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.track,
          alignItems: "center",
          justifyContent: "center",
        },
        stepText: { fontSize: 16, color: colors.text },
        estimate: { fontSize: 14, color: colors.textSecondary, minWidth: 30, textAlign: "center" },
        add: {
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: colors.focus,
        },
        addText: { color: colors.onPrimary, fontWeight: "600", fontSize: 14 },
        addDisabled: { opacity: 0.5 },
      }),
    [colors]
  );

  const canAdd = title.trim().length > 0;

  const submit = () => {
    if (!canAdd) {
      return;
    }
    onAdd(title.trim(), estimate);
    setTitle("");
    setEstimate(1);
  };

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Quick add a task…"
        placeholderTextColor={colors.textMuted}
        returnKeyType="done"
        onSubmitEditing={submit}
        accessibilityLabel="Quick add task title"
      />
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepButton}
          onPress={() => setEstimate((v) => Math.max(1, v - 1))}
          accessibilityRole="button"
          accessibilityLabel="Decrease estimate"
        >
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.estimate}>{estimate}p</Text>
        <Pressable
          style={styles.stepButton}
          onPress={() => setEstimate((v) => Math.min(20, v + 1))}
          accessibilityRole="button"
          accessibilityLabel="Increase estimate"
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
      <Pressable
        style={[styles.add, !canAdd && styles.addDisabled]}
        onPress={submit}
        disabled={!canAdd}
        accessibilityRole="button"
        accessibilityLabel="Quick add task"
      >
        <Text style={styles.addText}>Add</Text>
      </Pressable>
    </View>
  );
};
