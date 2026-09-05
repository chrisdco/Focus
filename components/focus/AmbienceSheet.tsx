import { BottomSheet, RNHostView } from "@expo/ui";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { fontFamily } from "../../theme/fonts";
import { type as typeScale } from "../../theme/typography";
import { SoundMixer } from "./SoundMixer";

interface AmbienceSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const AmbienceSheet: React.FC<AmbienceSheetProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { flex: 1 },
        content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
        title: {
          ...typeScale.sheetTitle,
          color: colors.text,
          marginBottom: 12,
        },
        done: {
          marginTop: 12,
          backgroundColor: colors.focus,
          borderRadius: 12,
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
        },
        doneText: {
          color: colors.onPrimary,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
          fontSize: 16,
        },
      }),
    [colors]
  );

  return (
    <BottomSheet
      isPresented={visible}
      onDismiss={onClose}
      snapPoints={["half", "full"]}
      containerColor={colors.surface}
      contentPadding={0}
    >
      <RNHostView>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <Text style={styles.title}>Ambience</Text>
          <SoundMixer />
          <Pressable
            style={styles.done}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Done tuning ambience"
          >
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </ScrollView>
      </RNHostView>
    </BottomSheet>
  );
};
