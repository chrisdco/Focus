import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SettingsProvider, useSettings } from "../context/SettingsContext";
import { StatsProvider } from "../context/StatsContext";
import { TimerProvider } from "../context/TimerContext";
import { useAppStateReconciliation } from "../hooks/useAppStateReconciliation";
import { useTimerNotifications } from "../hooks/useTimerNotifications";
import { useTimerPersistence } from "../hooks/useTimerPersistence";
import { loadTimerSnapshot } from "../storage";
import type { TimerSnapshot } from "../types/timer";
import { colors } from "../theme/colors";

const TimerSideEffects: React.FC = () => {
  useTimerPersistence();
  useAppStateReconciliation();
  useTimerNotifications();
  return null;
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
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.focus} />
      </View>
    );
  }

  return (
    <TimerProvider initialSnapshot={snapshot} settings={settings}>
      <TimerSideEffects />
      <Stack screenOptions={{ headerShown: false }} />
    </TimerProvider>
  );
};

export const AppProviders: React.FC = () => {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <StatsProvider>
          <HydratedApp />
        </StatsProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
