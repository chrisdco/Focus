import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import { CelebrationOverlay } from "../../components/timer/CelebrationOverlay";
import { CircularTimer } from "../../components/timer/CircularTimer";
import { TimerButton } from "../../components/timer/TimerButton";
import { usePomodoroTimer } from "../../hooks/usePomodoroTimer";
import { usePersonalityMessage } from "../../hooks/usePersonalityMessage";
import { modeColors, modeLabels } from "../../theme/colors";
import { formatDurationLabel } from "../../utils/timer";

const TimerScreen: React.FC = () => {
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
    justCompleted,
  } = usePomodoroTimer();

  const [showCelebration, setShowCelebration] = useState(false);

  const personalityMessage = usePersonalityMessage({
    mode,
    isRunning,
    remainingMs,
    durationMs,
    justCompleted,
  });

  React.useEffect(() => {
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

  const primaryLabel = isRunning ? "Pause" : "Start";
  const accentColor = modeColors[mode];
  const canReset = remainingMs !== durationMs || isRunning;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Foco</Text>

        {mode === "focus" && (
          <Text style={styles.sessionCounter}>
            Session {sessionNumber} of {sessionsBeforeLongBreak}
          </Text>
        )}

        <View style={styles.timerSection}>
          <CircularTimer
            remainingMs={remainingMs}
            durationMs={durationMs}
            mode={mode}
          />
        </View>

        <View style={styles.controls}>
          <Text style={[styles.modeLabel, { color: accentColor }]}>
            {modeLabels[mode]} • {formatDurationLabel(durationMs)}
          </Text>

          {personalityMessage.length > 0 && (
            <Text style={styles.personalityMessage}>{personalityMessage}</Text>
          )}

          <View style={styles.buttonsRow}>
            <TimerButton
              label={primaryLabel}
              variant="primary"
              style={{ backgroundColor: accentColor }}
              onPress={handlePrimaryPress}
            />
            <TimerButton
              label="Reset"
              variant="secondary"
              disabled={!canReset}
              onPress={reset}
            />
          </View>
        </View>
      </View>

      <CelebrationOverlay
        visible={showCelebration}
        message="Session complete!"
      />
    </SafeAreaView>
  );
};

export default TimerScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F9FAFB",
    textAlign: "center",
    marginBottom: 8,
  },
  sessionCounter: {
    fontSize: 16,
    color: "#9CA3AF",
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
    color: "#D1D5DB",
    fontSize: 15,
    marginBottom: 16,
    fontStyle: "italic",
    paddingHorizontal: 16,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
});
