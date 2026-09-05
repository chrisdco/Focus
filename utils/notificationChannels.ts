import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

/** High-importance channel for timer completion chimes (sound + heads-up). */
export const TIMER_CHANNEL_ID = "foco-timer";
/** Default-importance channel for scheduled block reminders. */
export const REMINDER_CHANNEL_ID = "foco-reminders";

/**
 * Creates Android notification channels. Without these, sound, vibration,
 * and heads-up behavior on Android 8+ fall back to the generic default
 * channel and the completion chime is uncontrolled (often silent).
 * Idempotent — safe to call on every launch. No-op off Android.
 */
export const ensureAndroidChannels = async (): Promise<void> => {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync(TIMER_CHANNEL_ID, {
      name: "Timer",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: "Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  } catch {
    // Channels unsupported (e.g. Expo Go on some builds) — scheduling still
    // works, just without custom sound/importance behavior.
  }
};

/**
 * Foreground presentation policy. Web-guarded: notifications are a no-op on
 * web and setting a handler there only produces console noise.
 */
export const setupForegroundPresentation = (): void => {
  if (Platform.OS === "web") {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};
