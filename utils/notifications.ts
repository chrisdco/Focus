import { Platform } from "react-native";

import {
  reminderDate,
  reminderIdentifier,
} from "../domain/schedule";
import type { ScheduleBlock } from "../types/schedule";

/**
 * Single access point for everything notification-related.
 *
 * expo-notifications is STRIPPED from Expo Go on Android (SDK 53+) and its
 * module throws at import time there. A single static `import` anywhere in
 * the graph therefore crashes every route at load (surfacing as "missing
 * default export" warnings plus a fatal router TypeError). So this module
 * never statically imports expo-notifications: it lazy-requires it inside
 * try/catch and every helper degrades to a safe no-op when unavailable.
 * Timer, sounds, stats, and UI keep working — only the scheduled chimes
 * and reminders are skipped.
 */

type NotificationsModule = typeof import("expo-notifications");

/** High-importance channel for timer completion chimes (sound + heads-up). */
export const TIMER_CHANNEL_ID = "foco-timer";
/** Default-importance channel for scheduled block reminders. */
export const REMINDER_CHANNEL_ID = "foco-reminders";

const SCHEDULE_KIND = "scheduled-block";

let cachedModule: NotificationsModule | null | undefined;

const loadModule = (): NotificationsModule | null => {
  if (cachedModule !== undefined) {
    return cachedModule;
  }
  try {
    cachedModule = require("expo-notifications") as NotificationsModule;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
};

/** False on web and on Android Expo Go (module stripped) — UI can say why. */
export const isNotificationsAvailable = (): boolean => {
  if (Platform.OS === "web") {
    return false;
  }
  return loadModule() !== null;
};

/** Foreground presentation policy. Safe to call on every launch. */
export const setupForegroundPresentation = (): void => {
  if (Platform.OS === "web") {
    return;
  }
  const notifications = loadModule();
  if (!notifications) {
    return;
  }

  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};

/**
 * Creates Android notification channels. Without these, sound/importance on
 * Android 8+ fall back to the generic default channel and the completion
 * chime is uncontrolled (often silent). Idempotent, Android-only.
 */
export const ensureAndroidChannels = async (): Promise<void> => {
  if (Platform.OS !== "android") {
    return;
  }
  const notifications = loadModule();
  if (!notifications) {
    return;
  }

  try {
    await notifications.setNotificationChannelAsync(TIMER_CHANNEL_ID, {
      name: "Timer",
      importance: notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility:
        notifications.AndroidNotificationVisibility.PUBLIC,
    });
    await notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: "Reminders",
      importance: notifications.AndroidImportance.DEFAULT,
      sound: "default",
      lockscreenVisibility:
        notifications.AndroidNotificationVisibility.PRIVATE,
    });
  } catch {
    // Channels unsupported — scheduling still works with default behavior.
  }
};

const toGranted = (
  notifications: NotificationsModule,
  status: Awaited<ReturnType<NotificationsModule["getPermissionsAsync"]>>
): boolean =>
  status.granted ||
  status.ios?.status === notifications.IosAuthorizationStatus.PROVISIONAL;

export const areNotificationsGranted = async (): Promise<boolean> => {
  if (Platform.OS === "web") {
    return false;
  }
  const notifications = loadModule();
  if (!notifications) {
    return false;
  }
  try {
    return toGranted(notifications, await notifications.getPermissionsAsync());
  } catch {
    return false;
  }
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === "web") {
    return false;
  }
  const notifications = loadModule();
  if (!notifications) {
    return false;
  }
  try {
    return toGranted(
      notifications,
      await notifications.requestPermissionsAsync()
    );
  } catch {
    return false;
  }
};

export const scheduleTimerCompletion = async (args: {
  title: string;
  body: string;
  sound: boolean;
  seconds: number;
}): Promise<string | null> => {
  if (Platform.OS === "web") {
    return null;
  }
  const notifications = loadModule();
  if (!notifications) {
    return null;
  }
  try {
    return await notifications.scheduleNotificationAsync({
      content: {
        title: args.title,
        body: args.body,
        sound: args.sound ? "default" : undefined,
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: args.seconds,
        repeats: false,
        channelId: TIMER_CHANNEL_ID,
      },
    });
  } catch {
    return null;
  }
};

export const cancelNotificationById = async (id: string): Promise<void> => {
  if (Platform.OS === "web") {
    return;
  }
  const notifications = loadModule();
  if (!notifications) {
    return;
  }
  try {
    await notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Already fired or gone.
  }
};

/** Identifiers of scheduled timer notifications (block reminders excluded). */
export const listTimerNotificationIds = async (): Promise<string[]> => {
  if (Platform.OS === "web") {
    return [];
  }
  const notifications = loadModule();
  if (!notifications) {
    return [];
  }
  try {
    const scheduled = await notifications.getAllScheduledNotificationsAsync();
    return scheduled
      .filter((item) => !item.identifier.startsWith("foco-block-"))
      .map((item) => item.identifier);
  } catch {
    return [];
  }
};

export const syncBlockReminder = async (
  block: ScheduleBlock,
  enabled: boolean,
  playSound: boolean,
  title: string
): Promise<void> => {
  if (Platform.OS === "web") {
    return;
  }
  const notifications = loadModule();
  const identifier = reminderIdentifier(block.id);

  if (!notifications) {
    return;
  }

  try {
    await notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Identifier may not exist yet.
  }

  if (!enabled || block.kind !== "focus") {
    return;
  }

  const when = reminderDate(block);
  if (when.getTime() <= Date.now()) {
    return;
  }

  try {
    await notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: "Focus block starting soon",
        body: `${title} starts in 5 minutes.`,
        sound: playSound ? "default" : undefined,
        data: {
          kind: SCHEDULE_KIND,
          blockId: block.id,
          taskId: block.taskId ?? "",
        },
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  } catch {
    // DATE triggers are not available on every platform (e.g. web).
  }
};

export const cancelBlockReminder = async (blockId: string): Promise<void> => {
  if (Platform.OS === "web") {
    return;
  }
  const notifications = loadModule();
  if (!notifications) {
    return;
  }
  try {
    await notifications.cancelScheduledNotificationAsync(
      reminderIdentifier(blockId)
    );
  } catch {
    // Best-effort cancel.
  }
};

export const isScheduleNotification = (
  data: unknown
): data is { kind: string; blockId: string; taskId: string } => {
  if (!data || typeof data !== "object") {
    return false;
  }

  return (data as { kind?: string }).kind === SCHEDULE_KIND;
};

export const addNotificationResponseListener = (
  handler: (data: unknown) => void
): { remove: () => void } | null => {
  if (Platform.OS === "web") {
    return null;
  }
  const notifications = loadModule();
  if (!notifications) {
    return null;
  }
  try {
    return notifications.addNotificationResponseReceivedListener(
      (response) => {
        handler(response.notification.request.content.data);
      }
    );
  } catch {
    return null;
  }
};
