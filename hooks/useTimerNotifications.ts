import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useTimerContext } from "../context/TimerContext";
import { useSettings } from "../context/SettingsContext";
import { modeLabels } from "../theme/colors";
import {
  areNotificationsGranted,
  cancelNotificationById,
  ensureAndroidChannels,
  listTimerNotificationIds,
  requestNotificationPermissions,
  scheduleTimerCompletion,
  setupForegroundPresentation,
} from "../utils/notifications";

setupForegroundPresentation();

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
      await cancelNotificationById(id);
    }
  }, []);

  // Only prompt when the user actually enabled notifications, and respect
  // denial (never schedule when not granted).
  useEffect(() => {
    // Channels carry sound/importance on Android 8+ — ensure them before
    // anything schedules, independent of the permission state.
    void ensureAndroidChannels().catch(() => undefined);

    if (!settings.notificationsEnabled) {
      permissionGrantedRef.current = false;
      return;
    }

    let cancelled = false;
    const setup = async () => {
      try {
        const granted = await areNotificationsGranted();
        if (!cancelled && granted) {
          permissionGrantedRef.current = true;
          return;
        }

        const requested = await requestNotificationPermissions();
        if (!cancelled) {
          permissionGrantedRef.current = requested;
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
    if (!state.isRunning) {
      const cleanup = async () => {
        const ids = await listTimerNotificationIds();
        await Promise.all(ids.map((id) => cancelNotificationById(id)));
      };
      void cleanup().catch(() => undefined);
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

      // Android drops TIME_INTERVAL triggers under 60s. The in-app cue +
      // completion pipeline already cover an imminent end, so skip instead
      // of scheduling a notification that can never fire.
      if (Platform.OS === "android" && secondsUntilEnd < 60) {
        return;
      }

      const id = await scheduleTimerCompletion({
        title: `${modeLabels[state.mode]} complete`,
        body: "Your timer session has finished.",
        sound: settings.soundEnabled,
        seconds: secondsUntilEnd,
      }).catch(() => null);

      if (id === null) {
        return;
      }

      if (seq === syncSeqRef.current) {
        notificationIdRef.current = id;
      } else {
        await cancelNotificationById(id);
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
