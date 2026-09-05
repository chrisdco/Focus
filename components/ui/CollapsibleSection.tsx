import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { fontFamily } from "../../theme/fonts";
import { cardElevation } from "../../theme/shadows";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** Progressive-disclosure section: header is always visible, body on expand. */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = false,
  children,
}) => {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          ...cardElevation(isDark),
        },
      ]}
    >
      <Pressable
        style={[styles.header, open && styles.headerOpen]}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}, ${open ? "collapse" : "expand"}`}
      >
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Ionicons
          name={open ? "chevron-down" : "chevron-forward"}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>
      {open ? children : null}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerOpen: {
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: fontFamily.semiBold,
  },
});
