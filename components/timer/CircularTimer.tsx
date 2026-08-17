import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { colors as themeColors, modeColors } from "../../theme/colors";
import type { TimerMode } from "../../types/timer";
import { formatTime } from "../../utils/timer";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularTimerProps {
  remainingMs: number;
  durationMs: number;
  mode: TimerMode;
}

const CIRCLE_SIZE = 260;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const MODE_COLOR_VALUES = {
  focus: modeColors.focus,
  shortBreak: modeColors.shortBreak,
  longBreak: modeColors.longBreak,
} as const;

export const CircularTimer: React.FC<CircularTimerProps> = ({
  remainingMs,
  durationMs,
  mode,
}) => {
  const formatted = formatTime(remainingMs);
  const progress = useSharedValue(
    durationMs > 0 ? remainingMs / durationMs : 0
  );
  const colorProgress = useSharedValue(0);
  const prevModeRef = React.useRef(mode);

  useEffect(() => {
    progress.value = withTiming(
      durationMs > 0 ? remainingMs / durationMs : 0,
      { duration: 300 }
    );
  }, [remainingMs, durationMs, progress]);

  useEffect(() => {
    const modeIndex = mode === "focus" ? 0 : mode === "shortBreak" ? 1 : 2;
    colorProgress.value = withTiming(modeIndex, { duration: 400 });
    prevModeRef.current = mode;
  }, [mode, colorProgress]);

  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress.value);
    const stroke = interpolateColor(
      colorProgress.value,
      [0, 1, 2],
      [
        MODE_COLOR_VALUES.focus,
        MODE_COLOR_VALUES.shortBreak,
        MODE_COLOR_VALUES.longBreak,
      ]
    );

    return {
      strokeDashoffset,
      stroke,
    };
  });

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: "-90deg" }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.circleWrapper}>
        <Animated.View style={[styles.svgContainer, ringStyle]}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke="#1F2937"
              strokeWidth={STROKE_WIDTH}
              fill={themeColors.surface}
            />
            <AnimatedCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={modeColors[mode]}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              strokeLinecap="round"
              animatedProps={animatedCircleProps}
            />
          </Svg>
        </Animated.View>
        <View style={styles.timeOverlay}>
          <Text style={styles.timeText}>{formatted}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  svgContainer: {
    position: "absolute",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  timeOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 48,
    fontWeight: "600",
    color: "#F9FAFB",
    letterSpacing: 2,
  },
});

export default CircularTimer;
