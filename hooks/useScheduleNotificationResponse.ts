import { useEffect } from "react";
import { router } from "expo-router";

import { useTasks } from "../context/TasksContext";
import {
  addNotificationResponseListener,
  isScheduleNotification,
} from "../utils/notifications";

export const useScheduleNotificationResponse = (): void => {
  const { setActiveTaskId } = useTasks();

  useEffect(() => {
    const subscription = addNotificationResponseListener((data) => {
      if (!isScheduleNotification(data)) {
        return;
      }

      if (typeof data.taskId === "string" && data.taskId.length > 0) {
        setActiveTaskId(data.taskId);
      }

      router.push("/(tabs)");
    });

    if (!subscription) {
      return;
    }

    return () => subscription.remove();
  }, [setActiveTaskId]);
};
