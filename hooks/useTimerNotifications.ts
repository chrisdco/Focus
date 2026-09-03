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
  const permissionGrantedRef = useRef(false);
  const syncSeqRef = useRef(0);

  const cancelNotification = useCallback(async () => {
    if (notificationIdRef.current) {
      const id = notificationIdRef.current;
      notificationIdRef.current = null;
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {
        // Already fired or unsupported platform.
      }
    }
  }, []);

  // Only prompt when the user actually enabled notifications, and respect
  // denial (never schedule when not granted).
  useEffect(() => {
    if (!settings.notificationsEnabled) {
      permissionGrantedRef.current = false;
      return;
    }

    let cancelled = false;
    const setup = async () => {
      try {
        const permissions = await Notifications.getPermissionsAsync();

        const granted =
          permissions.granted ||
          permissions.ios?.status ===
            Notifications.IosAuthorizationStatus.PROVISIONAL;

        if (!granted) {
          const requested = await Notifications.requestPermissionsAsync();
          if (!cancelled) {
            permissionGrantedRef.current =
              requested.granted ||
              requested.ios?.status ===
                Notifications.IosAuthorizationStatus.PROVISIONAL;
          }
          return;
        }

        if (!cancelled) {
          permissionGrantedRef.current = true;
        }
      } catch {
        if (!cancelled) {
          permissionGrantedRef.current = false;
        }
      }
    };

    void setup();
    return () => {
      cancelled = true;
    };
  }, [settings.notificationsEnabled]);

  // Clear timer orphans from a previous launch (block reminders use
  // `foco-block-*` identifiers and are left alone; ScheduleProvider re-syncs).
  useEffect(() => {
    const cleanup = async () => {
      try {
        const scheduled =
          await Notifications.getAllScheduledNotificationsAsync();
        await Promise.all(
          scheduled
            .filter((n) => !n.identifier.startsWith("foco-block-"))
            .map((n) =>
              Notifications.cancelScheduledNotificationAsync(n.identifier).catch(
                () => undefined
              )
            )
        );
      } catch {
        // Unsupported platform (e.g. web).
      }
    };

    if (!state.isRunning) {
      void cleanup();
    }
    // Once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const seq = (syncSeqRef.current += 1);
    const syncNotification = async () => {
      await cancelNotification();
      if (seq !== syncSeqRef.current) {
        return; // Superseded by a newer sync.
      }

      if (
        !settings.notificationsEnabled ||
        !permissionGrantedRef.current ||
        !state.isRunning ||
        state.expectedEndTime === null
      ) {
        return;
      }

      const secondsUntilEnd = Math.max(
        1,
        Math.ceil((state.expectedEndTime - Date.now()) / 1000)
      );

      try {
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

        if (seq === syncSeqRef.current) {
          notificationIdRef.current = id;
        } else {
          await Notifications.cancelScheduledNotificationAsync(id).catch(
            () => undefined
          );
        }
      } catch {
        // Scheduling unsupported (e.g. web) — timer still works.
      }
    };

    void syncNotification().catch(() => undefined);
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
      void cancelNotification().catch(() => undefined);
    };
  }, [cancelNotification]);
};
