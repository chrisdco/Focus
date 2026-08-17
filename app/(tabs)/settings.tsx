import React from "react";
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
import { clearAllData } from "../../storage";
import { colors } from "../../theme/colors";

interface DurationStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const DurationStepper: React.FC<DurationStepperProps> = ({
  label,
  value,
  onChange,
  min = 1,
  max = 60,
}) => (
  <View style={styles.stepperRow}>
    <Text style={styles.stepperLabel}>{label}</Text>
    <View style={styles.stepperControls}>
      <Pressable
        style={styles.stepperButton}
        onPress={() => onChange(Math.max(min, value - 1))}
        hitSlop={8}
      >
        <Text style={styles.stepperButtonText}>−</Text>
      </Pressable>
      <Text style={styles.stepperValue}>{value} min</Text>
      <Pressable
        style={styles.stepperButton}
        onPress={() => onChange(Math.min(max, value + 1))}
        hitSlop={8}
      >
        <Text style={styles.stepperButtonText}>+</Text>
      </Pressable>
    </View>
  </View>
);

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  value,
  onValueChange,
}) => (
  <View style={styles.toggleRow}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.focus }}
      thumbColor={colors.text}
    />
  </View>
);

const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { resetStats } = useStats();

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
            resetSettings();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Durations</Text>
          <DurationStepper
            label="Focus"
            value={settings.focusDurationMinutes}
            onChange={(v) => updateSettings({ focusDurationMinutes: v })}
          />
          <DurationStepper
            label="Short break"
            value={settings.shortBreakDurationMinutes}
            onChange={(v) => updateSettings({ shortBreakDurationMinutes: v })}
            max={30}
          />
          <DurationStepper
            label="Long break"
            value={settings.longBreakDurationMinutes}
            onChange={(v) => updateSettings({ longBreakDurationMinutes: v })}
            max={45}
          />
          <DurationStepper
            label="Sessions before long break"
            value={settings.sessionsBeforeLongBreak}
            onChange={(v) => updateSettings({ sessionsBeforeLongBreak: v })}
            min={2}
            max={8}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <ToggleRow
            label="Haptics"
            value={settings.hapticsEnabled}
            onValueChange={(v) => updateSettings({ hapticsEnabled: v })}
          />
          <ToggleRow
            label="Sound"
            value={settings.soundEnabled}
            onValueChange={(v) => updateSettings({ soundEnabled: v })}
          />
          <ToggleRow
            label="Notifications"
            value={settings.notificationsEnabled}
            onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
          />
          <ToggleRow
            label="Dark mode"
            value={settings.darkMode}
            onValueChange={(v) => updateSettings({ darkMode: v })}
          />
        </View>

        <Pressable style={styles.dangerButton} onPress={handleResetAll}>
          <Text style={styles.dangerButtonText}>Reset all data</Text>
        </Pressable>

        <Text style={styles.hint}>
          Duration changes apply to future sessions only.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    minHeight: 44,
  },
  stepperLabel: {
    fontSize: 16,
    color: colors.text,
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
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: {
    fontSize: 22,
    color: colors.text,
    fontWeight: "500",
  },
  stepperValue: {
    fontSize: 16,
    color: colors.text,
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
    color: colors.text,
  },
  dangerButton: {
    marginTop: 8,
    paddingVertical: 14,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EF4444",
    alignItems: "center",
  },
  dangerButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
});
