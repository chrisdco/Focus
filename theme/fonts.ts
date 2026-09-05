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
  extraBold: family("Nunito_800ExtraBold"),
} as const;

export type FontWeightName = keyof typeof fontFamily;

export const fontFamilyForWeight = (
  weight: "400" | "500" | "600" | "700" | "800"
): string => {
  switch (weight) {
    case "400":
      return fontFamily.regular;
    case "500":
      return fontFamily.medium;
    case "600":
      return fontFamily.semiBold;
    case "700":
      return fontFamily.bold;
    case "800":
      return fontFamily.extraBold;
  }
};
