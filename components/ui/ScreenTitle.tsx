import React from "react";
import { StyleSheet, Text } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { type as typeScale } from "../../theme/typography";

interface ScreenTitleProps {
  title: string;
  accessibilityLabel?: string;
}

/** Left-aligned editorial screen title shared by all tabs. */
export const ScreenTitle: React.FC<ScreenTitleProps> = ({
  title,
  accessibilityLabel,
}) => {
  const { colors } = useTheme();

  return (
    <Text
      style={[styles.title, { color: colors.text }]}
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      {title}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    ...typeScale.title,
    textAlign: "left",
    marginBottom: 16,
  },
});
