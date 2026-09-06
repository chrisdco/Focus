import { LinearGradient } from "expo-linear-gradient";
import React, { type ReactNode, useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { fontFamily } from "../../theme/fonts";

interface GradientButtonProps {
  label?: string;
  /** Icon content for the circular variant (e.g. play/pause glyph). */
  icon?: ReactNode;
  /** Circular 88px play-style button instead of the full-width bar. */
  circular?: boolean;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/** Signature primary CTA: one ember-to-amber gradient, Opal-sheet style. */
export const GradientButton: React.FC<GradientButtonProps> = ({
  label,
  icon,
  circular = false,
  onPress,
  disabled = false,
  accessibilityLabel,
}) => {
  const { colors, gradient } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pressable: { borderRadius: 16, overflow: "hidden" },
        pressableCircular: { borderRadius: 44, overflow: "hidden" },
        disabled: { opacity: 0.5 },
        fill: {
          minHeight: 56,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        },
        fillCircular: {
          width: 88,
          height: 88,
          borderRadius: 44,
          alignItems: "center",
          justifyContent: "center",
        },
        label: {
          color: colors.onPrimary,
          fontWeight: "700",
          fontSize: 17,
          fontFamily: fontFamily.bold,
        },
      }),
    [colors]
  );

  return (
    <Pressable
      style={[
        circular ? styles.pressableCircular : styles.pressable,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label ?? "Activate"}
      accessibilityState={{ disabled }}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: circular ? 1 : 0 }}
        style={circular ? styles.fillCircular : styles.fill}
      >
        {icon ?? <Text style={styles.label}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
};
