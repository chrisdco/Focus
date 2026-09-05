import { Link, Stack } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../context/ThemeContext";

export default function NotFound() {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
          paddingHorizontal: 24,
        },
        title: { fontSize: 20, fontWeight: "700", color: colors.text },
        body: {
          fontSize: 15,
          color: colors.textMuted,
          textAlign: "center",
          marginTop: 8,
          marginBottom: 16,
        },
        link: { fontSize: 16, fontWeight: "600", color: colors.focus },
      }),
    [colors]
  );

  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist</Text>
        <Text style={styles.body}>
          The link you followed is broken or the screen moved.
        </Text>
        <Link href="/(tabs)" style={styles.link}>
          Back to timer
        </Link>
      </View>
    </>
  );
}
