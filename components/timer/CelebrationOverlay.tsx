import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface CelebrationOverlayProps {
  visible: boolean;
  message?: string;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  visible,
  message = "Session complete!",
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1800, withTiming(0, { duration: 400 }))
      );
      scale.value = withSpring(1, { damping: 8, stiffness: 200 });
    } else {
      opacity.value = 0;
      scale.value = 0.5;
    }
  }, [visible, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, animatedStyle]} pointerEvents="none">
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2, 6, 23, 0.75)",
    zIndex: 10,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  message: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F9FAFB",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
