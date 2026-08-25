import { useCallback, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";

import { useSettings } from "../context/SettingsContext";
import { useTimerContext } from "../context/TimerContext";
import { modeLabels } from "../theme/colors";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useTimerNotifications = (): void => {
  const { settings } = useSettings();
  const { state } = useTimerContext();
  const notificationIdRef = useRef<string | null>(null);

  const cancelNotification = useCallback(async () => {
    if (notificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(
        notificationIdRef.current
      );
      notificationIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    const setup = async () => {
      const permissions = await Notifications.getPermissionsAsync();

      const granted =
        permissions.granted ||
        permissions.ios?.status ===
          Notifications.IosAuthorizationStatus.PROVISIONAL;

      if (!granted) {
        await Notifications.requestPermissionsAsync();
      }
    };

    void setup();
  }, []);

  useEffect(() => {
    const syncNotification = async () => {
      await cancelNotification();

      if (
        !settings.notificationsEnabled ||
        !state.isRunning ||
        state.expectedEndTime === null
      ) {
        return;
      }

      const secondsUntilEnd = Math.max(
        1,
        Math.ceil((state.expectedEndTime - Date.now()) / 1000)
      );

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${modeLabels[state.mode]} complete`,
          body: "Your timer session has finished.",
          sound: settings.soundEnabled ? "default" : undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilEnd,
        },
      });

      notificationIdRef.current = id;
    };

    void syncNotification();
  }, [
    state.isRunning,
    state.expectedEndTime,
    state.mode,
    settings.notificationsEnabled,
    settings.soundEnabled,
    cancelNotification,
  ]);

  useEffect(() => {
    return () => {
      void cancelNotification();
    };
  }, [cancelNotification]);
};
