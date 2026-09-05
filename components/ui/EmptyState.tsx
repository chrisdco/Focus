import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { fontFamily } from "../../theme/fonts";
import { type as typeScale } from "../../theme/typography";

interface EmptyStateProps {
  title: string;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container} accessibilityRole="text">
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
  },
  title: {
    ...typeScale.body,
    fontWeight: "600",
    fontFamily: fontFamily.semiBold,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    ...typeScale.caption,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
