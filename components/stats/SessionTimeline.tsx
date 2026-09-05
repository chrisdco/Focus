import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { EmptyState } from "../ui/EmptyState";
import { useTheme } from "../../context/ThemeContext";
import { fontFamily } from "../../theme/fonts";
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
          fontFamily: fontFamily.medium,
          color: colors.text,
        },
        meta: {
          fontSize: 13,
          color: colors.textMuted,
          marginTop: 2,
          fontFamily: fontFamily.regular,
        },
        duration: {
          fontSize: 14,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
          color: colors.focus,
        },
      }),
    [colors]
  );

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No recent sessions"
        message="Finished pomodoros will list here."
      />
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
              <Text style={styles.title}>{taskTitle ?? "Focus session"}</Text>
              <Text style={styles.meta}>
                {date.toLocaleDateString()} ·{" "}
                {date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <Text style={styles.duration}>{formatTime(session.durationMs)}</Text>
          </View>
        );
      })}
    </View>
  );
};
