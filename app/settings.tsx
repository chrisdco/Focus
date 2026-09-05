import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { BREAK_SOUNDS, COMPLETION_SOUNDS } from "../data/cueSounds";
import { useSchedule } from "../context/ScheduleContext";
import { useSettings } from "../context/SettingsContext";
import { useStats } from "../context/StatsContext";
import { useTasks } from "../context/TasksContext";
import { useTheme } from "../context/ThemeContext";
import { useTimerContext } from "../context/TimerContext";
import { isNotificationsAvailable } from "../utils/notifications";
import {
  clearAllData,
  clearTimerSnapshot,
} from "../storage";
import { DEFAULT_SETTINGS } from "../types/settings";
import { getDurationForMode } from "../domain/timerMachine";
import { ACCENT_PRESETS } from "../theme/accents";
import { cardElevation } from "../theme/shadows";
import { type as typeScale } from "../theme/typography";
import type { TimerLayout } from "../types/settings";
import { playCue } from "../utils/playCue";

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
      thumbColor={colors.onPrimary}
    />
  </View>
);

const SettingsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { resetStats } = useStats();
  const { resetTasks } = useTasks();
  const { resetSchedule } = useSchedule();
  const { dispatch: timerDispatch } = useTimerContext();
  // Static per launch: false on web and on Android Expo Go (module stripped).
  const notificationsAvailable = isNotificationsAvailable();

  const screenStyles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32,
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
          ...typeScale.section,
          color: colors.textMuted,
          marginBottom: 12,
        },
        chipRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        },
        accentSwatch: {
          width: 36,
          height: 36,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: colors.border,
        },
        accentSwatchSelected: {
          borderColor: colors.text,
        },
        optionChip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
        },
        optionChipActive: {
          backgroundColor: colors.focus,
          borderColor: colors.focus,
        },
        optionText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        optionTextActive: {
          color: colors.onPrimary,
        },
        layoutRow: {
          flexDirection: "row",
          gap: 8,
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
        note: {
          marginTop: 8,
          fontSize: 13,
          color: colors.textMuted,
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
            // Stop the timer first so the persistence effect can't re-save a
            // mid-session snapshot after the wipe, then clear storage before
            // resetting in-memory state to defaults.
            timerDispatch({
              type: "RESET",
              durationMs: getDurationForMode("focus", DEFAULT_SETTINGS),
            });
            void (async () => {
              try {
                await clearTimerSnapshot();
                await clearAllData();
              } catch {
                // Best-effort; in-memory resets below still apply.
              }
              resetStats();
              resetTasks();
              resetSchedule();
              resetSettings();
            })();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ScrollView
        style={screenStyles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={screenStyles.section}>
          <Text style={screenStyles.sectionTitle}>Appearance</Text>
          <ToggleRow
            colors={colors}
            label="Dark mode"
            value={settings.darkMode}
            onValueChange={(v) => updateSettings({ darkMode: v })}
          />
          <Text style={[styles.stepperLabel, { color: colors.text, marginTop: 8 }]}>
            Accent
          </Text>
          <View style={screenStyles.chipRow}>
            {ACCENT_PRESETS.map((preset) => {
              const selected = settings.accentId === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${preset.label} accent`}
                  accessibilityState={{ selected }}
                  onPress={() => updateSettings({ accentId: preset.id })}
                  style={[
                    screenStyles.accentSwatch,
                    { backgroundColor: preset.color },
                    selected && screenStyles.accentSwatchSelected,
                  ]}
                />
              );
            })}
          </View>
          <Text style={[styles.stepperLabel, { color: colors.text, marginTop: 16 }]}>
            Timer layout
          </Text>
          <View style={screenStyles.layoutRow}>
            {(["standard", "minimal"] as TimerLayout[]).map((layout) => {
              const active = settings.timerLayout === layout;
              return (
                <Pressable
                  key={layout}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => updateSettings({ timerLayout: layout })}
                  style={[
                    screenStyles.optionChip,
                    active && screenStyles.optionChipActive,
                  ]}
                >
                  <Text
                    style={[
                      screenStyles.optionText,
                      active && screenStyles.optionTextActive,
                    ]}
                  >
                    {layout === "standard" ? "Standard" : "Minimal"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={screenStyles.section}>
          <Text style={screenStyles.sectionTitle}>Sounds</Text>
          <ToggleRow
            colors={colors}
            label="Sound"
            value={settings.soundEnabled}
            onValueChange={(v) => updateSettings({ soundEnabled: v })}
          />
          <Text style={[styles.stepperLabel, { color: colors.text, marginTop: 8 }]}>
            Completion
          </Text>
          <View style={screenStyles.chipRow}>
            {COMPLETION_SOUNDS.map((option) => {
              const active = settings.completionSoundId === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Completion sound ${option.label}`}
                  onPress={() => {
                    updateSettings({ completionSoundId: option.id });
                    void playCue(option.source);
                  }}
                  style={[
                    screenStyles.optionChip,
                    active && screenStyles.optionChipActive,
                  ]}
                >
                  <Text
                    style={[
                      screenStyles.optionText,
                      active && screenStyles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.stepperLabel, { color: colors.text, marginTop: 12 }]}>
            Break
          </Text>
          <View style={screenStyles.chipRow}>
            {BREAK_SOUNDS.map((option) => {
              const active = settings.breakSoundId === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Break sound ${option.label}`}
                  onPress={() => {
                    updateSettings({ breakSoundId: option.id });
                    void playCue(option.source);
                  }}
                  style={[
                    screenStyles.optionChip,
                    active && screenStyles.optionChipActive,
                  ]}
                >
                  <Text
                    style={[
                      screenStyles.optionText,
                      active && screenStyles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

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
          <Text style={screenStyles.sectionTitle}>Focus environment</Text>
          <ToggleRow
            colors={colors}
            label="Ambient sounds"
            value={settings.ambientSoundEnabled}
            onValueChange={(v) => updateSettings({ ambientSoundEnabled: v })}
          />
          <ToggleRow
            colors={colors}
            label="Auto-play on focus start"
            value={settings.autoPlaySoundscape}
            onValueChange={(v) => updateSettings({ autoPlaySoundscape: v })}
          />
          <ToggleRow
            colors={colors}
            label="Continue during breaks"
            value={settings.continueSoundscapeOnBreak}
            onValueChange={(v) => updateSettings({ continueSoundscapeOnBreak: v })}
          />
          <ToggleRow
            colors={colors}
            label="Focus background animation"
            value={settings.focusAnimationsEnabled}
            onValueChange={(v) => updateSettings({ focusAnimationsEnabled: v })}
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
            label="Notifications"
            value={settings.notificationsEnabled}
            onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
          />
          {!notificationsAvailable ? (
            <Text style={screenStyles.note}>
              Scheduled chimes need a development build on Android — Expo Go
              does not include notifications support.
            </Text>
          ) : null}
        </View>

        <Pressable style={screenStyles.dangerButton} onPress={handleResetAll}>
          <Text style={screenStyles.dangerButtonText}>Reset all data</Text>
        </Pressable>

        <Text style={screenStyles.hint}>
          Duration changes apply to future sessions only.
        </Text>
      </ScrollView>
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
