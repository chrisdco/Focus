import { BottomSheet, RNHostView } from "@expo/ui";
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useSettings } from "../../context/SettingsContext";
import { useTheme } from "../../context/ThemeContext";
import { type as typeScale } from "../../theme/typography";
import { GradientButton } from "./GradientButton";
import {
  loadHasSeenOnboarding,
  saveHasSeenOnboarding,
} from "../../storage";
import { isNotificationsAvailable } from "../../utils/notifications";

/**
 * Value-first onboarding: explains the one loop, lets the user opt into
 * session reminders (which triggers the OS permission flow with a reason),
 * and never blocks the timer again once dismissed.
 */
export const OnboardingGate: React.FC = () => {
  const { colors } = useTheme();
  const { settings, updateSettings, isHydrated } = useSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void loadHasSeenOnboarding().then((seen) => {
      if (!seen) {
        setVisible(true);
      }
    });
  }, [isHydrated]);

  const dismiss = () => {
    setVisible(false);
    void saveHasSeenOnboarding().catch(() => undefined);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          flex: 1,
        },
        content: {
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 32,
        },
        title: {
          ...typeScale.sheetTitle,
          color: colors.text,
          marginBottom: 12,
        },
        row: { marginBottom: 12 },
        rowTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
        rowBody: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
        reminderRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 4,
          marginBottom: 12,
        },
      }),
    [colors]
  );

  return (
    <BottomSheet
      isPresented={visible}
      onDismiss={dismiss}
      snapPoints={["half", "full"]}
      containerColor={colors.surface}
      contentPadding={0}
    >
      <RNHostView>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Welcome to Foco</Text>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>One loop</Text>
            <Text style={styles.rowBody}>
              Timer, tasks, stats, and ambience share one session log — start a
              focus and everything else follows.
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Finish one session</Text>
            <Text style={styles.rowBody}>
              Run a single 25-minute focus. Streaks, goals, and history unlock
              from there.
            </Text>
          </View>
          <View style={styles.reminderRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowTitle}>Session reminders</Text>
              <Text style={styles.rowBody}>
                {isNotificationsAvailable()
                  ? "A chime when a session ends, even outside the app."
                  : "Needs a development build on Android — Expo Go can't schedule reminders."}
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) =>
                updateSettings({ notificationsEnabled: value })
              }
              trackColor={{ true: colors.focus, false: colors.track }}
              thumbColor={colors.onPrimary}
              accessibilityLabel="Session reminders"
            />
          </View>
          <GradientButton
            label="Begin"
            onPress={dismiss}
            accessibilityLabel="Begin focusing"
          />
        </ScrollView>
      </RNHostView>
    </BottomSheet>
  );
};
