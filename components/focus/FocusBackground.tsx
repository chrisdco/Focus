import React, { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "../../context/ThemeContext";

interface FocusBackgroundProps {
  active: boolean;
  paused: boolean;
  /** 0..1 streak depth — a 7-day streak looks deeper than day 1. */
  intensity?: number;
}

export const FocusBackground: React.FC<FocusBackgroundProps> = ({
  active,
  paused,
  intensity = 0,
}) => {
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const drift = useSharedValue(0);
  const depth = Math.max(0, Math.min(1, intensity));

  useEffect(() => {
    if (reduceMotion) {
      drift.value = 0.5;
      return;
    }
    if (active && !paused) {
      drift.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
      return;
    }

    drift.value = withTiming(0, { duration: 400 });
  }, [active, paused, reduceMotion, drift]);

  const baseOpacity = 0.14 + depth * 0.16;

  const blobStyle = useAnimatedStyle(() => ({
    opacity: baseOpacity + drift.value * 0.12,
    transform: [
      { translateX: -40 + drift.value * 30 },
      { translateY: 20 - drift.value * 25 },
      { scale: 1 + depth * 0.12 + drift.value * 0.08 },
    ],
  }));

  const blobStyleSecondary = useAnimatedStyle(() => ({
    opacity: baseOpacity * 0.75 + (1 - drift.value) * 0.1,
    transform: [
      { translateX: 50 - drift.value * 35 },
      { translateY: -10 + drift.value * 20 },
      { scale: 1.05 - drift.value * 0.05 },
    ],
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          ...StyleSheet.absoluteFill,
          overflow: "hidden",
        },
        blob: {
          position: "absolute",
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: isDark ? colors.focus : `${colors.focus}88`,
          top: "18%",
          left: "10%",
        },
        blobSecondary: {
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: isDark ? colors.shortBreak : `${colors.shortBreak}66`,
          bottom: "22%",
          right: "8%",
        },
      }),
    [colors.focus, colors.shortBreak, isDark]
  );

  if (!active) {
    return null;
  }

  return (
    <Animated.View pointerEvents="none" style={styles.container}>
      <Animated.View style={[styles.blob, blobStyle]} />
      <Animated.View style={[styles.blobSecondary, blobStyleSecondary]} />
    </Animated.View>
  );
};
