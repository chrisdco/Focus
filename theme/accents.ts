export type AccentId =
  | "indigo"
  | "violet"
  | "rose"
  | "orange"
  | "teal"
  | "sky"
  | "lime"
  | "slate";

export interface AccentPreset {
  id: AccentId;
  label: string;
  color: string;
  /** Gradient end for primary CTAs; starts at `color`. */
  gradientEnd: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "indigo", label: "Indigo", color: "#4F46E5", gradientEnd: "#818CF8" },
  { id: "violet", label: "Violet", color: "#7C3AED", gradientEnd: "#A78BFA" },
  { id: "rose", label: "Rose", color: "#E11D48", gradientEnd: "#FB7185" },
  { id: "orange", label: "Orange", color: "#EA580C", gradientEnd: "#FBBF24" },
  { id: "teal", label: "Teal", color: "#0D9488", gradientEnd: "#2DD4BF" },
  { id: "sky", label: "Sky", color: "#0284C7", gradientEnd: "#38BDF8" },
  { id: "lime", label: "Lime", color: "#65A30D", gradientEnd: "#A3E635" },
  { id: "slate", label: "Slate", color: "#475569", gradientEnd: "#94A3B8" },
];

export const DEFAULT_ACCENT_ID: AccentId = "orange";

export const isAccentId = (value: string | undefined): value is AccentId =>
  ACCENT_PRESETS.some((preset) => preset.id === value);

export const getAccentColor = (id: AccentId): string =>
  ACCENT_PRESETS.find((preset) => preset.id === id)?.color ??
  ACCENT_PRESETS[0].color;

export const getAccentGradient = (id: AccentId): [string, string] => {
  const preset =
    ACCENT_PRESETS.find((entry) => entry.id === id) ?? ACCENT_PRESETS[0];
  return [preset.color, preset.gradientEnd];
};
