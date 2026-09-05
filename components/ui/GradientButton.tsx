import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { displayFont } from "../../theme/fonts";

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/** Signature primary CTA: one ember-to-amber gradient, Opal-sheet style. */
export const GradientButton: React.FC<GradientButtonProps> = ({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
}) => {
  const { colors, gradient } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pressable: { borderRadius: 16, overflow: "hidden" },
        disabled: { opacity: 0.5 },
        fill: {
          minHeight: 56,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        },
        label: {
          color: colors.onPrimary,
          fontWeight: "700",
          fontSize: 17,
          fontFamily: displayFont.bold,
        },
      }),
    [colors]
  );

  return (
    <Pressable
      style={[styles.pressable, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fill}
      >
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
};
