import { Platform } from "react-native";

/**
 * Nunito everywhere: one warm, rounded voice for the whole app
 * (Forest-adjacent, never the default system look). Faces are bundled
 * via @expo-google-fonts, so offline-safe.
 *
 * Android resolves custom fonts by EXACT family name while iOS resolves
 * by family + weight — so every weight maps here and every Text style
 * with a fontWeight must carry its matching family. Never rely on
 * fontWeight alone on Android.
 */
const family = (android: string): string =>
  Platform.select({ ios: "Nunito", android, default: "Nunito" });

export const fontFamily = {
  regular: family("Nunito_400Regular"),
  medium: family("Nunito_500Medium"),
  semiBold: family("Nunito_600SemiBold"),
  bold: family("Nunito_700Bold"),
} as const;
