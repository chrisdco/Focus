import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";

interface BarChartProps {
  values: number[];
  labels: string[];
}

export const BarChart: React.FC<BarChartProps> = ({ values, labels }) => {
  const { colors } = useTheme();

  const maxValue = Math.max(...values, 1);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        chart: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          height: 120,
        },
        barColumn: {
          flex: 1,
          alignItems: "center",
        },
        barTrack: {
          width: 20,
          height: 80,
          backgroundColor: colors.track,
          borderRadius: 6,
          justifyContent: "flex-end",
          overflow: "hidden",
        },
        barFill: {
          width: "100%",
          backgroundColor: colors.focus,
          borderRadius: 6,
          minHeight: 4,
        },
        barLabel: {
          fontSize: 10,
          color: colors.textMuted,
          marginTop: 4,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.chart}>
      {values.map((value, index) => (
        <View key={`${labels[index]}-${index}`} style={styles.barColumn}>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { height: `${(value / maxValue) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.barLabel}>{labels[index]}</Text>
        </View>
      ))}
    </View>
  );
};
