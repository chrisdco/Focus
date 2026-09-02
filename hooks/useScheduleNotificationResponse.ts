import { useEffect } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

import { useTasks } from "../context/TasksContext";
import { isScheduleNotification } from "../utils/scheduleReminders";

export const useScheduleNotificationResponse = (): void => {
  const { setActiveTaskId } = useTasks();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        if (!isScheduleNotification(data)) {
          return;
        }

        if (typeof data.taskId === "string" && data.taskId.length > 0) {
          setActiveTaskId(data.taskId);
        }

        router.push("/(tabs)");
      }
    );

    return () => subscription.remove();
  }, [setActiveTaskId]);
};
