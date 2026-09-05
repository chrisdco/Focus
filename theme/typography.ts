import { fontFamily } from "./fonts";

export const type = {
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
    fontFamily: fontFamily.bold,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    fontFamily: fontFamily.bold,
  },
  section: {
    fontSize: 16,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
    fontFamily: fontFamily.semiBold,
  },
  /** Small-caps eyebrow labels, Opal/Health style hero + group headers. */
  eyebrow: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
    fontFamily: fontFamily.semiBold,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    fontFamily: fontFamily.regular,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
    fontFamily: fontFamily.regular,
  },
  timer: {
    fontSize: 48,
    fontWeight: "600" as const,
    letterSpacing: 2,
    fontFamily: fontFamily.semiBold,
  },
};

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
