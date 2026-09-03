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
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "indigo", label: "Indigo", color: "#4F46E5" },
  { id: "violet", label: "Violet", color: "#7C3AED" },
  { id: "rose", label: "Rose", color: "#E11D48" },
  { id: "orange", label: "Orange", color: "#EA580C" },
  { id: "teal", label: "Teal", color: "#0D9488" },
  { id: "sky", label: "Sky", color: "#0284C7" },
  { id: "lime", label: "Lime", color: "#65A30D" },
  { id: "slate", label: "Slate", color: "#475569" },
];

export const DEFAULT_ACCENT_ID: AccentId = "orange";

export const isAccentId = (value: string | undefined): value is AccentId =>
  ACCENT_PRESETS.some((preset) => preset.id === value);

export const getAccentColor = (id: AccentId): string =>
  ACCENT_PRESETS.find((preset) => preset.id === id)?.color ??
  ACCENT_PRESETS[0].color;
