import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ProjectFocusStat } from "../../domain/statsCalculator";
import { useTheme } from "../../context/ThemeContext";

interface ProjectBreakdownProps {
  data: ProjectFocusStat[];
}

export const ProjectBreakdown: React.FC<ProjectBreakdownProps> = ({ data }) => {
  const { colors } = useTheme();
  const maxMinutes = Math.max(...data.map((item) => item.focusMinutes), 1);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          marginBottom: 12,
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 6,
        },
        label: {
          fontSize: 14,
          color: colors.text,
          fontWeight: "500",
        },
        value: {
          fontSize: 13,
          color: colors.textMuted,
        },
        track: {
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.track,
          overflow: "hidden",
        },
        fill: {
          height: "100%",
          backgroundColor: colors.focus,
          borderRadius: 4,
        },
        empty: {
          fontSize: 14,
          color: colors.textMuted,
          textAlign: "center",
          paddingVertical: 12,
        },
      }),
    [colors]
  );

  if (data.length === 0) {
    return (
      <Text style={styles.empty}>
        Link tasks to sessions to see project breakdown.
      </Text>
    );
  }

  return (
    <View>
      {data.slice(0, 5).map((item) => (
        <View key={item.projectId} style={styles.row}>
          <View style={styles.header}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>
              {item.focusMinutes}m · {item.pomodoros} sessions
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${(item.focusMinutes / maxMinutes) * 100}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
};
