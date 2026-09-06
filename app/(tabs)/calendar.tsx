import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CalendarSection } from "../../components/calendar/CalendarSection";
import { ScreenTitle } from "../../components/ui/ScreenTitle";
import { useTheme } from "../../context/ThemeContext";

const CalendarScreen: React.FC = () => {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        container: {
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 16,
        },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <ScreenTitle title="Calendar" />
        <CalendarSection />
      </View>
    </SafeAreaView>
  );
};

export default CalendarScreen;
