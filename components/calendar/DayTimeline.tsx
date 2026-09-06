import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { fontFamily } from "../../theme/fonts";
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  HOUR_HEIGHT,
  formatClock,
  kindLabel,
} from "../../domain/schedule";
import type { ScheduleBlock } from "../../types/schedule";

interface DayTimelineProps {
  blocks: ScheduleBlock[];
  resolveTaskTitle: (taskId: string | null) => string | null;
  onPressBlock: (block: ScheduleBlock) => void;
}

export const DayTimeline: React.FC<DayTimelineProps> = ({
  blocks,
  resolveTaskTitle,
  onPressBlock,
}) => {
  const { colors } = useTheme();
  const hours = DAY_END_HOUR - DAY_START_HOUR;
  const height = hours * HOUR_HEIGHT;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        timeline: {
          height,
          marginTop: 8,
        },
        hourRow: {
          height: HOUR_HEIGHT,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          flexDirection: "row",
        },
        hourLabel: {
          width: 52,
          fontSize: 12,
          color: colors.textMuted,
          marginTop: -8,
          fontFamily: fontFamily.regular,
        },
        gutter: { flex: 1 },
        block: {
          position: "absolute",
          left: 56,
          right: 8,
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderWidth: 1,
        },
        blockTitle: {
          fontSize: 13,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
        },
        blockMeta: {
          fontSize: 11,
          marginTop: 2,
          fontFamily: fontFamily.regular,
        },
      }),
    [colors, height]
  );

  return (
    <View style={styles.timeline}>
      {Array.from({ length: hours }, (_, index) => {
        const hour = DAY_START_HOUR + index;
        return (
          <View key={hour} style={styles.hourRow}>
            <Text style={styles.hourLabel}>
              {String(hour).padStart(2, "0")}:00
            </Text>
            <View style={styles.gutter} />
          </View>
        );
      })}

      {blocks.map((block) => {
        const rawTop =
          ((block.startMinutes - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
        // Clamp into the visible 06:00–22:00 window so pre-dawn blocks
        // don't render at negative offsets and late blocks don't overflow.
        const top = Math.max(0, Math.min(height - 8, rawTop));
        const maxHeight = Math.max(8, height - top);
        const blockHeight = Math.min(
          Math.max(28, (block.durationMinutes / 60) * HOUR_HEIGHT),
          maxHeight
        );
        const isFocus = block.kind === "focus";
        const background = isFocus ? `${colors.focus}22` : `${colors.shortBreak}22`;
        const border = isFocus ? colors.focus : colors.shortBreak;
        const title =
          resolveTaskTitle(block.taskId) ?? kindLabel(block.kind);

        return (
          <Pressable
            key={block.id}
            style={[
              styles.block,
              {
                top,
                height: blockHeight,
                backgroundColor: background,
                borderColor: border,
              },
            ]}
            onPress={() => onPressBlock(block)}
            accessibilityRole="button"
            accessibilityLabel={`${title} at ${formatClock(block.startMinutes)}`}
          >
            <Text style={[styles.blockTitle, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.blockMeta, { color: colors.textMuted }]}>
              {formatClock(block.startMinutes)} · {block.durationMinutes}m
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
