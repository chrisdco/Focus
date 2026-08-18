import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import type { SessionLog } from "../../types/stats";
import { formatTime } from "../../utils/timer";

interface SessionTimelineProps {
  sessions: SessionLog[];
  resolveTaskTitle: (taskId?: string) => string | null;
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({
  sessions,
  resolveTaskTitle,
}) => {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        title: {
          fontSize: 15,
          fontWeight: "500",
          color: colors.text,
        },
        meta: {
          fontSize: 13,
          color: colors.textMuted,
          marginTop: 2,
        },
        duration: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.focus,
        },
        empty: {
          fontSize: 14,
          color: colors.textMuted,
          textAlign: "center",
          paddingVertical: 16,
        },
      }),
    [colors]
  );

  if (sessions.length === 0) {
    return (
      <Text style={styles.empty}>No sessions logged yet.</Text>
    );
  }

  return (
    <View>
      {sessions.map((session) => {
        const date = new Date(session.completedAt);
        const taskTitle = resolveTaskTitle(session.taskId);

        return (
          <View key={session.id} style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.title}>
                {taskTitle ?? "Focus session"}
              </Text>
              <Text style={styles.meta}>
                {date.toLocaleDateString()} ·{" "}
                {date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <Text style={styles.duration}>
              {formatTime(session.durationMs)}
            </Text>
          </View>
        );
      })}
    </View>
  );
};
