import * as Notifications from "expo-notifications";

import {
  reminderDate,
  reminderIdentifier,
} from "../domain/schedule";
import type { ScheduleBlock } from "../types/schedule";
import { REMINDER_CHANNEL_ID } from "./notificationChannels";

const SCHEDULE_KIND = "scheduled-block";

export const syncBlockReminder = async (
  block: ScheduleBlock,
  enabled: boolean,
  playSound: boolean,
  title: string
): Promise<void> => {
  const identifier = reminderIdentifier(block.id);

  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
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
    await Notifications.scheduleNotificationAsync({
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
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  } catch {
    // DATE triggers are not available on every platform (e.g. web).
  }
};

export const cancelBlockReminder = async (blockId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(
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
