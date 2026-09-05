import { Platform } from "react-native";

/**
 * Display face (Nunito — warm, rounded, Forest-adjacent) for expressive
 * type only: screen titles, sheet titles, hero numerals. Body and quiet
 * UI stay on system (Flow-quiet). Bundled via @expo-google-fonts, so
 * offline-safe.
 *
 * Android resolves custom fonts by exact family name; iOS resolves by
 * family + weight, so both map here in one place.
 */
const display = (android: string): string =>
  Platform.select({ ios: "Nunito", android, default: "Nunito" });

export const displayFont = {
  semiBold: display("Nunito_600SemiBold"),
  bold: display("Nunito_700Bold"),
  extraBold: display("Nunito_800ExtraBold"),
} as const;
