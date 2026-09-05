import SegmentedControl from "@react-native-segmented-control/segmented-control";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/** Themed wrapper over the native segmented control (one per app). */
export const Segmented = <T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>): React.JSX.Element => {
  const { colors, isDark } = useTheme();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { marginBottom: 12 },
      }),
    []
  );

  return (
    <View style={styles.container}>
      <SegmentedControl
        values={options.map((option) => option.label)}
        selectedIndex={selectedIndex}
        onChange={(event) => {
          const next = options[event.nativeEvent.selectedSegmentIndex];
          if (next) {
            onChange(next.value);
          }
        }}
        backgroundColor={colors.surface}
        tintColor={colors.focus}
        fontStyle={{ color: colors.textMuted }}
        activeFontStyle={{ color: colors.onPrimary, fontWeight: "600" }}
        appearance={isDark ? "dark" : "light"}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
};
