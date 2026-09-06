import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DayActivity } from "../../domain/statsCalculator";
import { useTheme } from "../../context/ThemeContext";
import { fontFamily } from "../../theme/fonts";

interface FocusHeatmapProps {
  activity: DayActivity[];
  weeks?: number;
}

export const FocusHeatmap: React.FC<FocusHeatmapProps> = ({
  activity,
  weeks = 12,
}) => {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<DayActivity | null>(null);

  const maxPomodoros = Math.max(...activity.map((day) => day.pomodoros), 1);
  const visible = activity.slice(-weeks * 7);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 4,
        },
        cell: {
          width: 14,
          height: 14,
          borderRadius: 3,
        },
        detail: {
          marginTop: 12,
          fontSize: 13,
          color: colors.textMuted,
          textAlign: "center",
          fontFamily: fontFamily.regular,
        },
      }),
    [colors]
  );

  const cellColor = (pomodoros: number): string => {
    if (pomodoros === 0) {
      return colors.track;
    }
    const intensity = pomodoros / maxPomodoros;
    if (intensity > 0.66) {
      return colors.focus;
    }
    if (intensity > 0.33) {
      return `${colors.focus}AA`;
    }
    return `${colors.focus}55`;
  };

  return (
    <View>
      <View style={styles.grid}>
        {visible.map((day) => (
          <Pressable
            key={day.dateKey}
            style={[styles.cell, { backgroundColor: cellColor(day.pomodoros) }]}
            onPress={() => setSelected(day)}
            accessibilityRole="button"
            accessibilityLabel={`${day.dateKey}, ${day.pomodoros} pomodoros`}
          />
        ))}
      </View>
      {selected && (
        <Text style={styles.detail}>
          {selected.dateKey}: {selected.pomodoros} pomodoros ·{" "}
          {selected.focusMinutes} min
        </Text>
      )}
    </View>
  );
};
