import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "../../context/ThemeContext";
import { displayFont } from "../../theme/fonts";
import { modeLabels } from "../../theme/colors";
import type { TimerMode } from "../../types/timer";
import { formatTime } from "../../utils/timer";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularTimerProps {
  remainingMs: number;
  durationMs: number;
  mode: TimerMode;
  enlarged?: boolean;
  /** Whether the timer is currently running (drives breathe + glow). */
  active?: boolean;
  /** Global animation toggle from settings. */
  animationsEnabled?: boolean;
}

const BASE_SIZE = 260;
const ENLARGED_SIZE = 300;
const STROKE_WIDTH = 8;

export const CircularTimer: React.FC<CircularTimerProps> = ({
  remainingMs,
  durationMs,
  mode,
  enlarged = false,
  active = false,
  animationsEnabled = true,
}) => {
  const { colors, modeColors } = useTheme();
  const reduceMotion = useReducedMotion();
  const circleSize = enlarged ? ENLARGED_SIZE : BASE_SIZE;
  const radius = (circleSize - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;

  const formatted = formatTime(remainingMs);
  const elapsed = durationMs > 0 ? 1 - remainingMs / durationMs : 0;
  const progress = useSharedValue(
    durationMs > 0 ? remainingMs / durationMs : 0
  );
  const colorProgress = useSharedValue(0);
  const breath = useSharedValue(1);
  const glow = useSharedValue(elapsed);

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

  useEffect(() => {
    glow.value = withTiming(elapsed, { duration: 500 });
  }, [elapsed, glow]);

  // Breathing ring while a focus session runs — subtle 4s inhale/exhale.
  // Disabled with reduced motion or the animation setting.
  useEffect(() => {
    const breathing =
      active && mode === "focus" && animationsEnabled && !reduceMotion;
    if (!breathing) {
      breath.value = withTiming(1, { duration: 300 });
      return;
    }
    breath.value = withRepeat(
      withSequence(
        withTiming(1.018, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [active, mode, animationsEnabled, reduceMotion, breath]);

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

  // Warmth: the ring glows brighter the deeper into the session.
  const animatedGlowProps = useAnimatedProps(() => ({
    opacity: 0.12 + glow.value * 0.4,
  }));

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: "-90deg" }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circleWrapper,
          { width: circleSize, height: circleSize },
          breatheStyle,
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
              strokeWidth={STROKE_WIDTH + 6}
              fill="transparent"
              strokeLinecap="round"
              opacity={0.12}
              animatedProps={animatedGlowProps}
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
      </Animated.View>
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
    fontFamily: displayFont.semiBold,
    fontVariant: ["tabular-nums"],
  },
});

export default CircularTimer;
