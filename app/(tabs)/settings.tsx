import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useSettings } from "../../context/SettingsContext";
import { useStats } from "../../context/StatsContext";
import { useTasks } from "../../context/TasksContext";
import { useTheme } from "../../context/ThemeContext";
import { clearAllData } from "../../storage";
import { cardElevation } from "../../theme/shadows";

interface DurationStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const DurationStepper: React.FC<
  DurationStepperProps & { colors: ReturnType<typeof useTheme>["colors"] }
> = ({ label, value, onChange, min = 1, max = 60, colors }) => (
  <View style={styles.stepperRow}>
    <Text style={[styles.stepperLabel, { color: colors.text }]}>{label}</Text>
    <View style={styles.stepperControls}>
      <Pressable
        style={[styles.stepperButton, { backgroundColor: colors.track }]}
        onPress={() => onChange(Math.max(min, value - 1))}
        hitSlop={8}
      >
        <Text style={[styles.stepperButtonText, { color: colors.text }]}>−</Text>
      </Pressable>
      <Text style={[styles.stepperValue, { color: colors.text }]}>
        {value} min
      </Text>
      <Pressable
        style={[styles.stepperButton, { backgroundColor: colors.track }]}
        onPress={() => onChange(Math.min(max, value + 1))}
        hitSlop={8}
      >
        <Text style={[styles.stepperButtonText, { color: colors.text }]}>+</Text>
      </Pressable>
    </View>
  </View>
);

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const ToggleRow: React.FC<
  ToggleRowProps & { colors: ReturnType<typeof useTheme>["colors"] }
> = ({ label, value, onValueChange, colors }) => (
  <View style={styles.toggleRow}>
    <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.focus }}
      thumbColor="#FFFFFF"
    />
  </View>
);

const SettingsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { resetStats } = useStats();
  const { resetTasks } = useTasks();

  const screenStyles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
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
          color: colors.text,
          textAlign: "center",
          marginBottom: 24,
        },
        section: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colors.border,
          ...cardElevation(isDark),
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.textMuted,
          marginBottom: 12,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        dangerButton: {
          marginTop: 8,
          paddingVertical: 14,
          minHeight: 44,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.danger,
          alignItems: "center",
        },
        dangerButtonText: {
          color: colors.danger,
          fontSize: 16,
          fontWeight: "600",
        },
        hint: {
          marginTop: 12,
          fontSize: 13,
          color: colors.textMuted,
          textAlign: "center",
        },
      }),
    [colors, isDark]
  );

  const handleResetAll = () => {
    Alert.alert(
      "Reset all data",
      "This will erase all stats, logs, and settings. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            void clearAllData();
            resetStats();
            resetTasks();
            resetSettings();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <View style={screenStyles.container}>
        <Text style={screenStyles.title}>Settings</Text>

        <View style={screenStyles.section}>
          <Text style={screenStyles.sectionTitle}>Goals</Text>
          <DurationStepper
            colors={colors}
            label="Daily pomodoro goal"
            value={settings.dailyPomodoroGoal}
            onChange={(v) => updateSettings({ dailyPomodoroGoal: v })}
            min={1}
            max={20}
          />
        </View>

        <View style={screenStyles.section}>
          <Text style={screenStyles.sectionTitle}>Durations</Text>
          <DurationStepper
            colors={colors}
            label="Focus"
            value={settings.focusDurationMinutes}
            onChange={(v) => updateSettings({ focusDurationMinutes: v })}
          />
          <DurationStepper
            colors={colors}
            label="Short break"
            value={settings.shortBreakDurationMinutes}
            onChange={(v) => updateSettings({ shortBreakDurationMinutes: v })}
            max={30}
          />
          <DurationStepper
            colors={colors}
            label="Long break"
            value={settings.longBreakDurationMinutes}
            onChange={(v) => updateSettings({ longBreakDurationMinutes: v })}
            max={45}
          />
          <DurationStepper
            colors={colors}
            label="Sessions before long break"
            value={settings.sessionsBeforeLongBreak}
            onChange={(v) => updateSettings({ sessionsBeforeLongBreak: v })}
            min={2}
            max={8}
          />
        </View>

        <View style={screenStyles.section}>
          <Text style={screenStyles.sectionTitle}>Timer behavior</Text>
          <ToggleRow
            colors={colors}
            label="Auto-start next session"
            value={settings.autoStartNextSession}
            onValueChange={(v) => updateSettings({ autoStartNextSession: v })}
          />
          <ToggleRow
            colors={colors}
            label="Auto-enter focus mode"
            value={settings.autoEnterFocusMode}
            onValueChange={(v) => updateSettings({ autoEnterFocusMode: v })}
          />
        </View>

        <View style={screenStyles.section}>
          <Text style={screenStyles.sectionTitle}>Preferences</Text>
          <ToggleRow
            colors={colors}
            label="Haptics"
            value={settings.hapticsEnabled}
            onValueChange={(v) => updateSettings({ hapticsEnabled: v })}
          />
          <ToggleRow
            colors={colors}
            label="Sound"
            value={settings.soundEnabled}
            onValueChange={(v) => updateSettings({ soundEnabled: v })}
          />
          <ToggleRow
            colors={colors}
            label="Notifications"
            value={settings.notificationsEnabled}
            onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
          />
          <ToggleRow
            colors={colors}
            label="Dark mode"
            value={settings.darkMode}
            onValueChange={(v) => updateSettings({ darkMode: v })}
          />
        </View>

        <Pressable style={screenStyles.dangerButton} onPress={handleResetAll}>
          <Text style={screenStyles.dangerButtonText}>Reset all data</Text>
        </Pressable>

        <Text style={screenStyles.hint}>
          Duration changes apply to future sessions only.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    minHeight: 44,
  },
  stepperLabel: {
    fontSize: 16,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: {
    fontSize: 22,
    fontWeight: "500",
  },
  stepperValue: {
    fontSize: 16,
    minWidth: 56,
    textAlign: "center",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    minHeight: 44,
  },
  toggleLabel: {
    fontSize: 16,
  },
});
