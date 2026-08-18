import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "../../context/ThemeContext";

interface FocusBackgroundProps {
  active: boolean;
  paused: boolean;
}

export const FocusBackground: React.FC<FocusBackgroundProps> = ({
  active,
  paused,
}) => {
  const { colors, isDark } = useTheme();
  const drift = useSharedValue(0);

  React.useEffect(() => {
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

    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    drift.value = withTiming(0, { duration: 400 });
  }, [active, paused, drift]);

  const blobStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + drift.value * 0.12,
    transform: [
      { translateX: -40 + drift.value * 30 },
      { translateY: 20 - drift.value * 25 },
      { scale: 1 + drift.value * 0.08 },
    ],
  }));

  const blobStyleSecondary = useAnimatedStyle(() => ({
    opacity: 0.12 + (1 - drift.value) * 0.1,
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
