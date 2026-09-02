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

import { useTheme } from "../../context/ThemeContext";
import { modeLabels } from "../../theme/colors";
import type { TimerMode } from "../../types/timer";
import { formatTime } from "../../utils/timer";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularTimerProps {
  remainingMs: number;
  durationMs: number;
  mode: TimerMode;
  enlarged?: boolean;
}

const BASE_SIZE = 260;
const ENLARGED_SIZE = 300;
const STROKE_WIDTH = 8;

export const CircularTimer: React.FC<CircularTimerProps> = ({
  remainingMs,
  durationMs,
  mode,
  enlarged = false,
}) => {
  const { colors, modeColors } = useTheme();
  const circleSize = enlarged ? ENLARGED_SIZE : BASE_SIZE;
  const radius = (circleSize - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;

  const formatted = formatTime(remainingMs);
  const progress = useSharedValue(
    durationMs > 0 ? remainingMs / durationMs : 0
  );
  const colorProgress = useSharedValue(0);

  const modeColorValues = {
    focus: modeColors.focus,
    shortBreak: modeColors.shortBreak,
    longBreak: modeColors.longBreak,
  };

  useEffect(() => {
    progress.value = withTiming(
      durationMs > 0 ? remainingMs / durationMs : 0,
      { duration: 300 }
    );
  }, [remainingMs, durationMs, progress]);

  useEffect(() => {
    const modeIndex = mode === "focus" ? 0 : mode === "shortBreak" ? 1 : 2;
    colorProgress.value = withTiming(modeIndex, { duration: 400 });
  }, [mode, colorProgress]);

  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    const stroke = interpolateColor(
      colorProgress.value,
      [0, 1, 2],
      [
        modeColorValues.focus,
        modeColorValues.shortBreak,
        modeColorValues.longBreak,
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
      <View
        style={[
          styles.circleWrapper,
          { width: circleSize, height: circleSize },
        ]}
      >
        <Animated.View
          style={[
            styles.svgContainer,
            ringStyle,
            { width: circleSize, height: circleSize },
          ]}
        >
          <Svg width={circleSize} height={circleSize}>
            <Circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              stroke={colors.track}
              strokeWidth={STROKE_WIDTH}
              fill={colors.surface}
            />
            <AnimatedCircle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              stroke={modeColors[mode]}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={circumference}
              strokeLinecap="round"
              animatedProps={animatedCircleProps}
            />
          </Svg>
        </Animated.View>
        <View
          style={styles.timeOverlay}
          accessible
          accessibilityRole="timer"
          accessibilityLabel={`${modeLabels[mode]}, ${formatted} remaining`}
          accessibilityLiveRegion="polite"
        >
          <Text style={[styles.timeText, { color: colors.text, fontSize: enlarged ? 56 : 48 }]}>
            {formatted}
          </Text>
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
    alignItems: "center",
    justifyContent: "center",
  },
  svgContainer: {
    position: "absolute",
  },
  timeOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontWeight: "600",
    letterSpacing: 2,
  },
});

export default CircularTimer;
