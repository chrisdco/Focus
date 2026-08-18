import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { cardElevation } from "../../theme/shadows";
import type { AchievementProgress } from "../../types/achievements";

interface AchievementBadgesProps {
  achievements: AchievementProgress[];
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  achievements,
}) => {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        },
        badge: {
          width: "47%",
          backgroundColor: colors.background,
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
          ...cardElevation(isDark),
        },
        badgeLocked: {
          opacity: 0.45,
        },
        emoji: {
          fontSize: 24,
          marginBottom: 6,
        },
        title: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
        },
        description: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 2,
        },
      }),
    [colors, isDark]
  );

  return (
    <View style={styles.grid}>
      {achievements.map(({ achievement, unlocked }) => (
        <View
          key={achievement.id}
          style={[styles.badge, !unlocked && styles.badgeLocked]}
        >
          <Text style={styles.emoji}>{achievement.emoji}</Text>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>
        </View>
      ))}
    </View>
  );
};
