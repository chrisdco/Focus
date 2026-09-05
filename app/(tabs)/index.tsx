import React, { useEffect, useMemo, useState } from "react";
import { Alert, AppState, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { CelebrationOverlay } from "../../components/timer/CelebrationOverlay";
import { CircularTimer } from "../../components/timer/CircularTimer";
import { SessionCard } from "../../components/timer/SessionCard";
import { TimerButton } from "../../components/timer/TimerButton";
import { GradientButton } from "../../components/ui/GradientButton";
import { ActiveTaskPicker } from "../../components/tasks/ActiveTaskPicker";
import { TodayStrip } from "../../components/calendar/TodayStrip";
import { OnboardingGate } from "../../components/ui/OnboardingGate";
import { FocusBackground } from "../../components/focus/FocusBackground";
import { BreakBreather } from "../../components/focus/BreakBreather";
import { AmbienceSheet } from "../../components/focus/AmbienceSheet";
import { useFocusMode } from "../../context/FocusModeContext";
import { useSettings } from "../../context/SettingsContext";
import { useStats } from "../../context/StatsContext";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import { usePomodoroTimer } from "../../hooks/usePomodoroTimer";
import { usePersonalityMessage } from "../../hooks/usePersonalityMessage";
import { useSessionSound } from "../../hooks/useSessionSound";
import { modeLabels } from "../../theme/colors";
import { formatDurationLabel } from "../../utils/timer";

const TimerScreen: React.FC = () => {
  const { colors, modeColors } = useTheme();
  const { settings } = useSettings();
  const { isFocusMode } = useFocusMode();
  const { activeTask } = useTasks();
  const { stats, getTodayPomodoroCount } = useStats();
  const [taskPickerVisible, setTaskPickerVisible] = useState(false);
  const [appIsActive, setAppIsActive] = useState(AppState.currentState === "active");
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
    completedMode,
  } = usePomodoroTimer();

  const [showCelebration, setShowCelebration] = useState(false);
  const [ambienceVisible, setAmbienceVisible] = useState(false);
  const hasAmbience = settings.soundMix.some((layer) => layer.volume > 0);

  // Earned completion copy: reflect the actual day + streak instead of a
  // generic cheer. Counts include the just-logged session.
  const todayCount = getTodayPomodoroCount();
  const streak = stats.currentStreak;
  const celebrationMessage =
    completedMode === "focus"
      ? todayCount <= 1
        ? "First light today — well begun."
        : `${todayCount} gathered today · ${streak}-day streak`
      : "Break well earned — breathe easy.";

  useSessionSound(justCompleted, completedMode);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      setAppIsActive(nextState === "active");
    });

    return () => subscription.remove();
  }, []);

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
    if (!justCompleted) {
      return undefined;
    }

    const showTimer = setTimeout(() => setShowCelebration(true), 0);
    const hideTimer = setTimeout(() => setShowCelebration(false), 2500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
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
  const isMinimalLayout = settings.timerLayout === "minimal";
  const showChrome = !isFocusMode && !isMinimalLayout;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: isFocusMode ? 48 : 16,
          paddingBottom: 32,
        },
        title: {
          fontSize: isFocusMode ? 22 : 28,
          fontWeight: "700",
          color: colors.text,
          textAlign: "left",
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
          // Never crush the ring below its size: on short screens the
          // column scrolls instead of overlapping the controls.
          minHeight: isFocusMode ? 332 : 292,
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
          color: colors.textMuted,
          fontSize: 13,
          marginTop: 12,
          fontStyle: "italic",
          paddingHorizontal: 16,
        },
        activeTaskTitle: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
          textAlign: "left",
          marginTop: 2,
        },
        buttonsRow: {
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 12,
        },
      }),
    [colors, isFocusMode]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusBackground
        active={isFocusMode && settings.focusAnimationsEnabled}
        paused={!appIsActive}
        intensity={Math.min(1, streak / 7)}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {showChrome && <Text style={styles.title}>Timer</Text>}

        {showChrome && <TodayStrip />}

        {showChrome && (
          <SessionCard
            taskValue={
              activeTask
                ? `${activeTask.title} · ${activeTask.completedPomodoros}/${activeTask.estimatedPomodoros}`
                : "Choose a task"
            }
            taskLabel={
              activeTask
                ? `Working on ${activeTask.title}`
                : "Choose a task"
            }
            onTaskPress={() => setTaskPickerVisible(true)}
            showAmbience={settings.ambientSoundEnabled}
            ambienceValue={hasAmbience ? "Ambience · on" : "Ambience · off"}
            onAmbiencePress={() => setAmbienceVisible(true)}
          />
        )}

        {isFocusMode && (
          <Text style={styles.focusBadge}>Focus mode</Text>
        )}

        {mode === "focus" && showChrome && (
          <Text style={styles.sessionCounter}>
            Session {sessionNumber} of {sessionsBeforeLongBreak}
          </Text>
        )}

        {showChrome && (
          <SessionCard
            taskValue={
              activeTask
                ? `${activeTask.title} · ${activeTask.completedPomodoros}/${activeTask.estimatedPomodoros}`
                : "Choose a task"
            }
            taskLabel={
              activeTask
                ? `Working on ${activeTask.title}`
                : "Choose a task"
            }
            onTaskPress={() => setTaskPickerVisible(true)}
            showAmbience={settings.ambientSoundEnabled}
            ambienceValue={hasAmbience ? "Ambience · on" : "Ambience · off"}
            onAmbiencePress={() => setAmbienceVisible(true)}
          />
        )}

        {isFocusMode && (
          <Text style={styles.focusBadge}>Focus mode</Text>
        )}

        {mode === "focus" && showChrome && (
          <Text style={styles.sessionCounter}>
            Session {sessionNumber} of {sessionsBeforeLongBreak}
          </Text>
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
            active={isRunning}
            animationsEnabled={settings.focusAnimationsEnabled}
          />
        </Animated.View>

        <View style={styles.controls}>
          {mode !== "focus" && (
            <BreakBreather
              animationsEnabled={settings.focusAnimationsEnabled}
            />
          )}
          {showChrome && (
            <Text style={[styles.modeLabel, { color: accentColor }]}>
              {modeLabels[mode]} • {formatDurationLabel(durationMs)}
            </Text>
          )}

          <GradientButton
            label={isRunning ? "Pause" : `Start ${modeLabels[mode]}`}
            onPress={handlePrimaryPress}
            accessibilityLabel={`${primaryLabel} ${modeLabels[mode]} timer`}
          />
          <View style={styles.buttonsRow}>
            {showSkip && (isFocusMode || !isMinimalLayout) && (
              <TimerButton
                label={skipLabel}
                variant="secondary"
                onPress={handleSkipPress}
              />
            )}
            {showChrome && (
              <TimerButton
                label="Reset"
                variant="secondary"
                disabled={!canReset}
                onPress={reset}
              />
            )}
          </View>

          {showChrome && personalityMessage.length > 0 && (
            <Text style={styles.personalityMessage}>{personalityMessage}</Text>
          )}
        </View>
      </ScrollView>

      <CelebrationOverlay
        visible={showCelebration}
        message={celebrationMessage}
      />

      <ActiveTaskPicker
        visible={taskPickerVisible}
        onClose={() => setTaskPickerVisible(false)}
      />

      <OnboardingGate />

      <AmbienceSheet
        visible={ambienceVisible}
        onClose={() => setAmbienceVisible(false)}
      />
    </SafeAreaView>
  );
};

export default TimerScreen;
