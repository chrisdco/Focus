import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { cardElevation } from "../../theme/shadows";

interface SessionCardProps {
  taskValue: string;
  taskLabel: string;
  onTaskPress: () => void;
  showAmbience: boolean;
  ambienceValue: string;
  onAmbiencePress: () => void;
}

/**
 * Opal-sheet style grouped card: icon rows with label left, value +
 * chevron right. One card replaces the competing task/ambience pills.
 */
export const SessionCard: React.FC<SessionCardProps> = ({
  taskValue,
  taskLabel,
  onTaskPress,
  showAmbience,
  ambienceValue,
  onAmbiencePress,
}) => {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
          overflow: "hidden",
          ...cardElevation(isDark),
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          minHeight: 52,
          gap: 12,
        },
        rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
        label: { flex: 1, fontSize: 15, color: colors.text },
        value: { fontSize: 14, color: colors.textMuted },
      }),
    [colors, isDark]
  );

  return (
    <View style={styles.card}>
      <Pressable
        style={[styles.row, showAmbience && styles.rowBorder]}
        onPress={onTaskPress}
        accessibilityRole="button"
        accessibilityLabel={taskLabel}
      >
        <Ionicons name="checkbox-outline" size={20} color={colors.textMuted} />
        <Text style={styles.label} numberOfLines={1}>
          {taskValue}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      {showAmbience ? (
        <Pressable
          style={styles.row}
          onPress={onAmbiencePress}
          accessibilityRole="button"
          accessibilityLabel="Tune ambience mix"
        >
          <Ionicons
            name="musical-notes-outline"
            size={20}
            color={colors.textMuted}
          />
          <Text style={styles.label} numberOfLines={1}>
            {ambienceValue}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
};
