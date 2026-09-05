import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { getMonthCells } from "../../domain/schedule";

const WEEKDAY_HEADER = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MAX_DOTS = 3;

interface MonthGridProps {
  year: number;
  month: number;
  counts: Record<string, number>;
  selectedKey: string;
  todayKey: string;
  onSelect: (dateKey: string) => void;
}

export const MonthGrid: React.FC<MonthGridProps> = ({
  year,
  month,
  counts,
  selectedKey,
  todayKey,
  onSelect,
}) => {
  const { colors } = useTheme();
  const cells = useMemo(() => getMonthCells(year, month), [year, month]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerRow: { flexDirection: "row", marginBottom: 4 },
        headerCell: {
          flex: 1,
          alignItems: "center",
          paddingVertical: 6,
        },
        headerText: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.5,
          color: colors.textMuted,
        },
        weekRow: { flexDirection: "row" },
        cell: {
          flex: 1,
          aspectRatio: 1,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 999,
          margin: 2,
        },
        cellSelected: { backgroundColor: colors.focus },
        dayText: { fontSize: 15, color: colors.text },
        dayTextSelected: { color: colors.onPrimary, fontWeight: "700" },
        dayTextToday: { fontWeight: "700", color: colors.focus },
        dots: { flexDirection: "row", gap: 2, marginTop: 2, minHeight: 5 },
        dot: { width: 5, height: 5, borderRadius: 3 },
      }),
    [colors]
  );

  return (
    <View
      accessibilityLabel={`Calendar for ${month + 1}/${year}`}
    >
      <View style={styles.headerRow}>
        {WEEKDAY_HEADER.map((day, index) => (
          <View key={`${day}-${index}`} style={styles.headerCell}>
            <Text style={styles.headerText}>{day}</Text>
          </View>
        ))}
      </View>
      {Array.from({ length: Math.ceil(cells.length / 7) }, (_, week) => (
        <View key={week} style={styles.weekRow}>
          {cells.slice(week * 7, week * 7 + 7).map((dateKey, index) => {
            if (!dateKey) {
              return <View key={`blank-${index}`} style={styles.cell} />;
            }
            const count = counts[dateKey] ?? 0;
            const selected = dateKey === selectedKey;
            const isToday = dateKey === todayKey;
            return (
              <Pressable
                key={dateKey}
                style={[styles.cell, selected && styles.cellSelected]}
                onPress={() => onSelect(dateKey)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${dateKey}${count > 0 ? `, ${count} blocks` : ""}`}
              >
                <Text
                  style={[
                    styles.dayText,
                    selected && styles.dayTextSelected,
                    !selected && isToday && styles.dayTextToday,
                  ]}
                >
                  {Number(dateKey.slice(8, 10))}
                </Text>
                <View style={styles.dots}>
                  {Array.from(
                    { length: Math.min(count, MAX_DOTS) },
                    (_, dot) => (
                      <View
                        key={dot}
                        style={[
                          styles.dot,
                          {
                            backgroundColor: selected
                              ? colors.onPrimary
                              : colors.focus,
                          },
                        ]}
                      />
                    )
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};
