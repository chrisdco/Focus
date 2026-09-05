import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, router } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FocusModeProvider } from "../context/FocusModeContext";
import { ScheduleProvider } from "../context/ScheduleContext";
import { SettingsProvider, useSettings } from "../context/SettingsContext";
import { SoundscapeProvider } from "../context/SoundscapeContext";
import { StatsProvider } from "../context/StatsContext";
import { TasksProvider } from "../context/TasksContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { TimerProvider } from "../context/TimerContext";
import { useAppStateReconciliation } from "../hooks/useAppStateReconciliation";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { useFocusSoundscape } from "../hooks/useFocusSoundscape";
import { useScheduleNotificationResponse } from "../hooks/useScheduleNotificationResponse";
import { useTimerNotifications } from "../hooks/useTimerNotifications";
import { useTimerPersistence } from "../hooks/useTimerPersistence";
import { loadTimerSnapshot } from "../storage";
import type { TimerSnapshot } from "../types/timer";

const TimerSideEffects: React.FC = () => {
  useTimerPersistence();
  useAppStateReconciliation();
  useTimerNotifications();
  useScheduleNotificationResponse();
  return null;
};

const SoundscapeSideEffects: React.FC = () => {
  useFocusSoundscape();
  return null;
};

const closeSettings = (): void => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/(tabs)/profile");
  }
};

const SettingsDoneButton: React.FC<{ tint: string }> = ({ tint }) => (
  <Pressable
    onPress={closeSettings}
    accessibilityRole="button"
    accessibilityLabel="Done, back to profile"
    hitSlop={12}
  >
    <Text style={{ color: tint, fontSize: 17, fontWeight: "600" }}>Done</Text>
  </Pressable>
);

const RootStack: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true,
          title: "Settings",
          headerLargeTitle: true,
          headerTransparent: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLargeTitleStyle: { color: colors.text },
          headerTitleStyle: { color: colors.text },
          headerRight: () => <SettingsDoneButton tint={colors.focus} />,
        }}
      />
    </Stack>
  );
};

const LoadingScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.loading, { backgroundColor: colors.background }]}
      accessibilityLabel="Loading Foco"
    >
      <ActivityIndicator size="large" color={colors.focus} />
      <Text style={[styles.loadingLabel, { color: colors.textMuted }]}>
        Loading Foco
      </Text>
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
      <SoundscapeProvider>
        <FocusModeProvider>
          <ErrorBoundary>
            <TimerSideEffects />
            <SoundscapeSideEffects />
            <RootStack />
          </ErrorBoundary>
        </FocusModeProvider>
      </SoundscapeProvider>
    </TimerProvider>
  );
};

export const AppProviders: React.FC = () => {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <SettingsProvider>
          <ThemeProvider>
            <StatsProvider>
              <TasksProvider>
                <ScheduleProvider>
                  <HydratedApp />
                </ScheduleProvider>
              </TasksProvider>
            </StatsProvider>
          </ThemeProvider>
        </SettingsProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 15,
  },
});
