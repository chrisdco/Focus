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

import { useTheme } from "../../context/ThemeContext";

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
  const { colors } = useTheme();
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
        isPrimary
          ? { backgroundColor: colors.focus }
          : {
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: colors.border,
            },
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
            {
              color: isPrimary ? colors.onPrimary : colors.textSecondary,
              fontSize: isPrimary ? 18 : 16,
              fontWeight: isPrimary ? "600" : "500",
            },
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
  disabled: {
    opacity: 0.4,
  },
  label: {},
  pressedLabel: {
    opacity: 0.85,
  },
});
