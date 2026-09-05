import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../../context/ThemeContext";
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
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["75%"], []);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: { paddingHorizontal: 20, paddingBottom: 32 },
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
          fontSize: 16,
        },
      }),
    [colors]
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
    >
      <BottomSheetScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Ambience</Text>
        <SoundMixer />
        <Pressable
          style={styles.done}
          onPress={() => sheetRef.current?.dismiss()}
          accessibilityRole="button"
          accessibilityLabel="Done tuning ambience"
        >
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};
