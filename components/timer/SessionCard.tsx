import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";

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
  const { colors } = useTheme();

  return (
    <View
      className="rounded-2xl border mb-3 overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      <Pressable
        className="flex-row items-center px-4 min-h-[52px] gap-3"
        style={showAmbience ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
        onPress={onTaskPress}
        accessibilityRole="button"
        accessibilityLabel={taskLabel}
      >
        <Ionicons name="checkbox-outline" size={20} color={colors.textMuted} />
        <Text
          className="flex-1 text-[15px]"
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {taskValue}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      {showAmbience ? (
        <Pressable
          className="flex-row items-center px-4 min-h-[52px] gap-3"
          onPress={onAmbiencePress}
          accessibilityRole="button"
          accessibilityLabel="Tune ambience mix"
        >
          <Ionicons
            name="musical-notes-outline"
            size={20}
            color={colors.textMuted}
          />
          <Text
            className="flex-1 text-[15px]"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {ambienceValue}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
};
