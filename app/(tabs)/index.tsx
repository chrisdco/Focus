import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { CelebrationOverlay } from "../../components/timer/CelebrationOverlay";
import { CircularTimer } from "../../components/timer/CircularTimer";
import { TimerButton } from "../../components/timer/TimerButton";
import { ActiveTaskPicker } from "../../components/tasks/ActiveTaskPicker";
import { DailyGoalProgress } from "../../components/stats/DailyGoalProgress";
import { useFocusMode } from "../../context/FocusModeContext";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import { usePomodoroTimer } from "../../hooks/usePomodoroTimer";
import { usePersonalityMessage } from "../../hooks/usePersonalityMessage";
import { useSessionSound } from "../../hooks/useSessionSound";
import { modeLabels } from "../../theme/colors";
import { formatDurationLabel } from "../../utils/timer";

const TimerScreen: React.FC = () => {
  const { colors, modeColors } = useTheme();
  const { isFocusMode } = useFocusMode();
  const { activeTask } = useTasks();
  const [taskPickerVisible, setTaskPickerVisible] = useState(false);
  const {
    isRunning,
    remainingMs,
    durationMs,
    mode,
    sessionNumber,
    sessionsBeforeLongBreak,
    start,
    pause,
    reset,
    skipBreak,
    skipFocus,
    justCompleted,
  } = usePomodoroTimer();

  const [showCelebration, setShowCelebration] = useState(false);

  useSessionSound(justCompleted);

  const personalityMessage = usePersonalityMessage({
    mode,
    isRunning,
    remainingMs,
    durationMs,
    justCompleted,
  });

  const contentScale = useSharedValue(1);

  useEffect(() => {
    contentScale.value = withTiming(isFocusMode ? 1.08 : 1, { duration: 300 });
  }, [isFocusMode, contentScale]);

  const timerSectionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  useEffect(() => {
    if (justCompleted) {
      setShowCelebration(true);
      const timeout = setTimeout(() => setShowCelebration(false), 2500);
      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [justCompleted]);

  const handlePrimaryPress = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const handleSkipPress = () => {
    if (mode === "focus") {
      Alert.alert(
        "Skip focus session?",
        "This session won't count toward your stats or task progress.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Skip", style: "destructive", onPress: skipFocus },
        ]
      );
      return;
    }

    skipBreak();
  };

  const primaryLabel = isRunning ? "Pause" : "Start";
  const accentColor = modeColors[mode];
  const canReset = remainingMs !== durationMs || isRunning;
  const showSkip = isRunning || remainingMs !== durationMs;
  const skipLabel = mode === "focus" ? "Skip" : "Skip break";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: isFocusMode ? 48 : 16,
          paddingBottom: 32,
        },
        title: {
          fontSize: isFocusMode ? 22 : 28,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          marginBottom: 8,
        },
        focusBadge: {
          fontSize: 14,
          color: colors.textMuted,
          textAlign: "center",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        sessionCounter: {
          fontSize: 16,
          color: colors.textMuted,
          textAlign: "center",
          marginBottom: 16,
        },
        timerSection: {
          flex: 1,
          justifyContent: "center",
        },
        controls: {
          marginTop: 24,
        },
        modeLabel: {
          textAlign: "center",
          marginBottom: 12,
          fontSize: 16,
          fontWeight: "600",
        },
        personalityMessage: {
          textAlign: "center",
          color: colors.textSecondary,
          fontSize: 15,
          marginBottom: 16,
          fontStyle: "italic",
          paddingHorizontal: 16,
        },
        activeTaskButton: {
          alignSelf: "center",
          marginBottom: 12,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        activeTaskLabel: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
        },
        activeTaskTitle: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
          textAlign: "center",
          marginTop: 2,
        },
        buttonsRow: {
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        },
      }),
    [colors, isFocusMode]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {!isFocusMode && <Text style={styles.title}>Foco</Text>}

        {!isFocusMode && <DailyGoalProgress />}

        {isFocusMode && (
          <Text style={styles.focusBadge}>Focus mode</Text>
        )}

        {mode === "focus" && !isFocusMode && (
          <Text style={styles.sessionCounter}>
            Session {sessionNumber} of {sessionsBeforeLongBreak}
          </Text>
        )}

        {!isFocusMode && (
          <Pressable
            style={styles.activeTaskButton}
            onPress={() => setTaskPickerVisible(true)}
          >
            <Text style={styles.activeTaskLabel}>
              {activeTask ? "Working on" : "Choose a task"}
            </Text>
            {activeTask && (
              <Text style={styles.activeTaskTitle} numberOfLines={1}>
                {activeTask.title} · {activeTask.completedPomodoros}/
                {activeTask.estimatedPomodoros}
              </Text>
            )}
          </Pressable>
        )}

        {isFocusMode && activeTask && (
          <Text style={styles.activeTaskTitle} numberOfLines={1}>
            {activeTask.title}
          </Text>
        )}

        <Animated.View style={[styles.timerSection, timerSectionStyle]}>
          <CircularTimer
            remainingMs={remainingMs}
            durationMs={durationMs}
            mode={mode}
            enlarged={isFocusMode}
          />
        </Animated.View>

        <View style={styles.controls}>
          {!isFocusMode && (
            <Text style={[styles.modeLabel, { color: accentColor }]}>
              {modeLabels[mode]} • {formatDurationLabel(durationMs)}
            </Text>
          )}

          {!isFocusMode && personalityMessage.length > 0 && (
            <Text style={styles.personalityMessage}>{personalityMessage}</Text>
          )}

          <View style={styles.buttonsRow}>
            <TimerButton
              label={primaryLabel}
              variant="primary"
              style={{ backgroundColor: accentColor }}
              onPress={handlePrimaryPress}
            />
            {showSkip && (
              <TimerButton
                label={skipLabel}
                variant="secondary"
                onPress={handleSkipPress}
              />
            )}
            {!isFocusMode && (
              <TimerButton
                label="Reset"
                variant="secondary"
                disabled={!canReset}
                onPress={reset}
              />
            )}
          </View>
        </View>
      </View>

      <CelebrationOverlay
        visible={showCelebration}
        message="Session complete!"
      />

      <ActiveTaskPicker
        visible={taskPickerVisible}
        onClose={() => setTaskPickerVisible(false)}
      />
    </SafeAreaView>
  );
};

export default TimerScreen;
