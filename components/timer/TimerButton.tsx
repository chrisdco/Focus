import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { colors } from "../../theme/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TimerButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
}

export const TimerButton: React.FC<TimerButtonProps> = ({
  label,
  variant = "primary",
  style,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isPrimary = variant === "primary";

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPressIn={(event) => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        onPressOut?.(event);
      }}
    >
      {({ pressed }) => (
        <Text
          style={[
            styles.label,
            isPrimary ? styles.primaryLabel : styles.secondaryLabel,
            pressed && styles.pressedLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.focus,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
  },
  primaryLabel: {
    color: colors.text,
  },
  secondaryLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  pressedLabel: {
    opacity: 0.85,
  },
});
