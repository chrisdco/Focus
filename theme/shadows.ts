import type { ViewStyle } from "react-native";

/** Subtle elevation for surfaced cards in light mode. */
export const cardElevation = (isDark: boolean): ViewStyle =>
  isDark
    ? {}
    : {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      };
