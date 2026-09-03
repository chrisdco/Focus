import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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

interface BreakBreatherProps {
  animationsEnabled?: boolean;
}

const PHASE_MS = 4000;

/** Minimal break ritual: one timed breathing cue, no stats or task chrome. */
export const BreakBreather: React.FC<BreakBreatherProps> = ({
  animationsEnabled = true,
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const [inhale, setInhale] = useState(true);
  const breath = useSharedValue(1);

  const animated = animationsEnabled && !reduceMotion;

  useEffect(() => {
    if (!animated) {
      return;
    }
    const id = setInterval(() => setInhale((v) => !v), PHASE_MS);
    breath.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: PHASE_MS, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: PHASE_MS, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    return () => {
      clearInterval(id);
      breath.value = withTiming(1, { duration: 300 });
    };
  }, [animated, breath]);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animated ? breath.value : 1 }],
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { alignItems: "center", marginBottom: 12 },
        cue: {
          fontSize: 17,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        hint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
      }),
    [colors]
  );

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={inhale ? "Breathe in" : "Breathe out"}
    >
      <Animated.View style={breatheStyle}>
        <Text style={styles.cue}>
          {animated ? (inhale ? "Breathe in…" : "Breathe out…") : "Breathe easy."}
        </Text>
      </Animated.View>
      <Text style={styles.hint}>Step away · stretch · water</Text>
    </View>
  );
};
