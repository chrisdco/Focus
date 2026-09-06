import React, { useEffect, useMemo, useState } from "react";
import { Alert, AppState, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GradientButton } from "../../components/ui/GradientButton";
import { fontFamily } from "../../theme/fonts";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { CelebrationOverlay } from "../../components/timer/CelebrationOverlay";
import { CircularTimer } from "../../components/timer/CircularTimer";
import { SessionCard } from "../../components/timer/SessionCard";
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
  const { isFocusMode, toggleFocusMode } = useFocusMode();
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
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const target = isFocusMode ? 1.08 : 1;
    if (!settings.focusAnimationsEnabled || reduceMotion) {
      contentScale.value = target;
      return;
    }
    contentScale.value = withTiming(target, { duration: 300 });
  }, [isFocusMode, contentScale, settings.focusAnimationsEnabled, reduceMotion]);

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
  const strictFocus = settings.strictMode && mode === "focus";
  const skipLabel = mode === "focus" ? "Skip" : "Skip break";
  const isMinimalLayout = settings.timerLayout === "minimal";
  const showChrome = !isFocusMode && !isMinimalLayout;
  // Skip is always available mid-session (even minimal): without it there
  // is no escape path. Reset shows in chrome and fullscreen; strict hides both.
  const showSkip = !strictFocus && (isRunning || remainingMs !== durationMs);
  const showReset = !strictFocus && (showChrome || isFocusMode);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: isFocusMode ? 48 : 16,
          paddingBottom: 32,
        },
        timerSection: {
          flex: 1,
          justifyContent: "center",
          // Never crush the ring below its size: on short screens the
          // column scrolls instead of overlapping the controls.
          minHeight: isFocusMode ? 332 : 292,
        },
        iconButton: {
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
        },
        iconDisabled: {
          opacity: 0.35,
        },
        contractButton: {
          position: "absolute",
          top: 16,
          right: 20,
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
        },
      }),
    [isFocusMode]
  );

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      edges={isFocusMode ? ["top", "bottom"] : ["top"]}
    >
      <FocusBackground
        active={isFocusMode && settings.focusAnimationsEnabled}
        paused={!appIsActive}
        intensity={Math.min(1, streak / 7)}
      />
      {isFocusMode && (
        <Pressable
          style={styles.contractButton}
          onPress={toggleFocusMode}
          accessibilityRole="button"
          accessibilityLabel="Exit fullscreen focus"
          hitSlop={8}
        >
          <Ionicons name="contract-outline" size={24} color={colors.textMuted} />
        </Pressable>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
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
          <Text
            className="text-center mb-2 text-sm uppercase"
            style={{
              color: colors.textMuted,
              letterSpacing: 1,
              fontFamily: fontFamily.regular,
            }}
          >
            Focus mode
          </Text>
        )}

        {mode === "focus" && showChrome && (
          <Text
            className="text-center mb-4 text-base"
            style={{ color: colors.textMuted, fontFamily: fontFamily.regular }}
          >
            Session {sessionNumber} of {sessionsBeforeLongBreak}
          </Text>
        )}

        {isFocusMode && activeTask && (
          <Text
            className="text-[15px] font-semibold text-left mt-0.5"
            style={{ color: colors.text, fontFamily: fontFamily.semiBold }}
            numberOfLines={1}
          >
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

        <View className="mt-6">
          {mode !== "focus" && (
            <BreakBreather
              animationsEnabled={settings.focusAnimationsEnabled}
            />
          )}
          {showChrome && (
            <Text
              className="text-center mb-3 text-base font-semibold"
              style={{ color: accentColor, fontFamily: fontFamily.semiBold }}
            >
              {modeLabels[mode]} • {formatDurationLabel(durationMs)}
            </Text>
          )}

          <View className="items-center">
            <GradientButton
              circular
              icon={
                <Ionicons
                  name={isRunning ? "pause" : "play"}
                  size={38}
                  color={colors.onPrimary}
                  style={isRunning ? undefined : { marginLeft: 4 }}
                />
              }
              onPress={handlePrimaryPress}
              accessibilityLabel={`${primaryLabel} ${modeLabels[mode]} timer`}
            />
          </View>
          <View className="flex-row justify-center items-center mt-4">
            {showSkip && (
              <Pressable
                style={styles.iconButton}
                onPress={handleSkipPress}
                accessibilityRole="button"
                accessibilityLabel={skipLabel}
                hitSlop={8}
              >
                <Ionicons
                  name="play-skip-forward-outline"
                  size={24}
                  color={colors.textMuted}
                />
              </Pressable>
            )}
            {showReset && (
              <Pressable
                style={[styles.iconButton, !canReset && styles.iconDisabled]}
                onPress={reset}
                disabled={!canReset}
                accessibilityRole="button"
                accessibilityLabel="Reset timer"
                accessibilityState={{ disabled: !canReset }}
                hitSlop={8}
              >
                <Ionicons
                  name="refresh-outline"
                  size={24}
                  color={colors.textMuted}
                />
              </Pressable>
            )}
            {showChrome && (
              <Pressable
                style={styles.iconButton}
                onPress={toggleFocusMode}
                accessibilityRole="button"
                accessibilityLabel="Toggle fullscreen focus"
                hitSlop={8}
              >
                <Ionicons
                  name="expand-outline"
                  size={24}
                  color={colors.textMuted}
                />
              </Pressable>
            )}
          </View>

          {showChrome && personalityMessage.length > 0 && (
            <Text
              className="text-center mt-3 px-4 text-[13px] italic"
              style={{ color: colors.textMuted, fontFamily: fontFamily.regular }}
            >
              {personalityMessage}
            </Text>
          )}
        </View>
      </ScrollView>

      <CelebrationOverlay
        visible={showCelebration}
        message={celebrationMessage}
        animationsEnabled={settings.focusAnimationsEnabled}
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
