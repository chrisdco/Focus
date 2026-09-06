import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "../../context/ThemeContext";
import { type as typeScale } from "../../theme/typography";

interface CelebrationOverlayProps {
  visible: boolean;
  message?: string;
  animationsEnabled?: boolean;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  visible,
  message = "Session complete!",
  animationsEnabled = true,
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const animated = animationsEnabled && !reduceMotion;
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          ...StyleSheet.absoluteFill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.overlay,
          zIndex: 10,
        },
        message: {
          ...typeScale.sheetTitle,
          color: colors.onPrimary,
          textAlign: "center",
          paddingHorizontal: 24,
        },
      }),
    [colors]
  );

  useEffect(() => {
    if (visible) {
      if (!animated) {
        opacity.value = 1;
        scale.value = 1;
        return;
      }
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1800, withTiming(0, { duration: 400 }))
      );
      scale.value = withSpring(1, { damping: 8, stiffness: 200 });
    } else {
      opacity.value = 0;
      scale.value = 0.5;
    }
  }, [visible, animated, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, animatedStyle]} pointerEvents="none">
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};
