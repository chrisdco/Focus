import React, { useMemo } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import { useStats } from "../../context/StatsContext";
import { useTheme } from "../../context/ThemeContext";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const StatsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { stats, getWeeklyFocusCounts } = useStats();
  const weeklyCounts = getWeeklyFocusCounts();
  const maxCount = Math.max(...weeklyCounts, 1);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 32,
        },
        title: {
          fontSize: 28,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          marginBottom: 24,
        },
        cardsRow: {
          flexDirection: "row",
          gap: 12,
          marginBottom: 12,
        },
        card: {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
        },
        cardValue: {
          fontSize: 32,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 4,
        },
        cardLabel: {
          fontSize: 14,
          color: colors.textMuted,
        },
        chartSection: {
          marginTop: 24,
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 20,
        },
        chart: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          height: 140,
        },
        barColumn: {
          flex: 1,
          alignItems: "center",
        },
        barTrack: {
          width: 24,
          height: 100,
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
        barCount: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 6,
        },
        barLabel: {
          fontSize: 11,
          color: colors.textMuted,
          marginTop: 2,
        },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Stats</Text>

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{stats.currentStreak}</Text>
            <Text style={styles.cardLabel}>Day streak</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{stats.longestStreak}</Text>
            <Text style={styles.cardLabel}>Best streak</Text>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{stats.totalFocusSessions}</Text>
            <Text style={styles.cardLabel}>Sessions</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{stats.totalFocusMinutes}</Text>
            <Text style={styles.cardLabel}>Focus min</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Last 7 days</Text>
          <View style={styles.chart}>
            {weeklyCounts.map((count, index) => (
              <View key={DAY_LABELS[index]} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${(count / maxCount) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.barCount}>{count}</Text>
                <Text style={styles.barLabel}>{DAY_LABELS[index]}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default StatsScreen;
