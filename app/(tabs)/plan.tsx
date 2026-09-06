import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CalendarSection } from "../../components/calendar/CalendarSection";
import { TasksSection } from "../../components/tasks/TasksSection";
import { ScreenTitle } from "../../components/ui/ScreenTitle";
import { useTheme } from "../../context/ThemeContext";
import { type as typeScale } from "../../theme/typography";

/**
 * Agenda-first planning: tasks on top, schedule below, one shared scroll.
 * Composes the same section components the old tabs rendered — no forks.
 */
const PlanScreen: React.FC = () => {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        container: {
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32,
        },
        groupLabel: {
          ...typeScale.eyebrow,
          color: colors.textMuted,
          marginTop: 8,
          marginBottom: 8,
          paddingHorizontal: 4,
        },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle title="Plan" />

        <Text style={styles.groupLabel}>Tasks</Text>
        <TasksSection scrollable={false} />

        <Text style={styles.groupLabel}>Schedule</Text>
        <CalendarSection scrollable={false} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlanScreen;
