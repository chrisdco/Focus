import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FocusModeProvider } from "../context/FocusModeContext";
import { SettingsProvider, useSettings } from "../context/SettingsContext";
import { StatsProvider } from "../context/StatsContext";
import { TasksProvider } from "../context/TasksContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { TimerProvider } from "../context/TimerContext";
import { useAppStateReconciliation } from "../hooks/useAppStateReconciliation";
import { useTimerNotifications } from "../hooks/useTimerNotifications";
import { useTimerPersistence } from "../hooks/useTimerPersistence";
import { loadTimerSnapshot } from "../storage";
import type { TimerSnapshot } from "../types/timer";

const TimerSideEffects: React.FC = () => {
  useTimerPersistence();
  useAppStateReconciliation();
  useTimerNotifications();
  return null;
};

const LoadingScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.focus} />
    </View>
  );
};

const HydratedApp: React.FC = () => {
  const { settings, isHydrated: settingsReady } = useSettings();
  const [snapshot, setSnapshot] = useState<TimerSnapshot | null | undefined>(
    undefined
  );

  useEffect(() => {
    const hydrate = async () => {
      const stored = await loadTimerSnapshot();
      setSnapshot(stored);
    };

    void hydrate();
  }, []);

  if (!settingsReady || snapshot === undefined) {
    return <LoadingScreen />;
  }

  return (
    <TimerProvider initialSnapshot={snapshot} settings={settings}>
      <FocusModeProvider>
        <TimerSideEffects />
        <Stack screenOptions={{ headerShown: false }} />
      </FocusModeProvider>
    </TimerProvider>
  );
};

export const AppProviders: React.FC = () => {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ThemeProvider>
          <StatsProvider>
            <TasksProvider>
              <HydratedApp />
            </TasksProvider>
          </StatsProvider>
        </ThemeProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
