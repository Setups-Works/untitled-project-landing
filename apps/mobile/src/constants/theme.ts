// design-ok-file: React Native styles cannot read the web app's CSS custom properties, so this file mirrors them once.
// Source of truth: `:root` in apps/web/src/app/globals.css. Every other mobile file must use these tokens, never a literal colour.
import type { Tone } from "@untitled/types";
import { Platform } from "react-native";

export const Palette = {
  page: "#f5f4eb",
  surface: "#ffffff",
  surfaceMuted: "#f8f5ea",
  surfaceSunken: "#efebdb",
  surfaceAccent: "#e8efe7",
  fillDark: "#191d1a",
  onDark: "#f4f3e9",
  fg: "#1b1c14",
  fgMuted: "#5f6055",
  fgSubtle: "#7e7e72",
  fgFaint: "#8f9084",
  line: "rgba(27,28,20,0.10)",
  lineStrong: "rgba(27,28,20,0.20)",
  glass: "rgba(255,255,255,0.60)",
  glassHi: "rgba(255,255,255,0.80)",
  glassRing: "rgba(255,255,255,0.85)",
  greenBg: "#e7f1ea",
  greenFg: "#1f5d49",
  greenLine: "rgba(31,93,73,0.26)",
  clayBg: "#f4e7e3",
  clayFg: "#9a5a4a",
  orangeFg: "#c26a1a",
  rec: "#d64545",
  shadow: "#28230a",
  scrim: "rgba(27,28,20,0.45)",
  scrimLight: "rgba(245,244,235,0.82)",
  glassAndroid: "rgba(255,255,255,0.42)",
  activeTabPill: "rgba(27,28,20,0.08)",
} as const;

/** The `at-<tint>` pairs from the web: soft background, hairline, foreground. */
export const Tints: Record<Tone, { bg: string; line: string; fg: string }> = {
  sand: { bg: "#f1ead9", line: "rgba(122,106,60,0.20)", fg: "#7a6a3c" },
  violet: { bg: "#ece5f2", line: "rgba(95,74,122,0.20)", fg: "#5f4a7a" },
  blue: { bg: "#e4eef2", line: "rgba(63,100,112,0.20)", fg: "#3f6470" },
  amber: { bg: "#fae9bd", line: "rgba(138,109,42,0.20)", fg: "#8a6d2a" },
  gold: { bg: "#fbe3c8", line: "rgba(160,98,40,0.20)", fg: "#a06228" },
  mint: { bg: "#dcefe6", line: "rgba(31,93,73,0.20)", fg: "#1f5d49" },
  green: { bg: "#e8efe7", line: "rgba(31,93,73,0.26)", fg: "#1f5d49" },
  clay: { bg: "#f6e3dc", line: "rgba(154,90,74,0.20)", fg: "#9a5a4a" },
};

/** The order tints are handed out in when a list of cards has no colour of its own (notes, journal days…). */
export const TONE_CYCLE: Tone[] = ["violet", "mint", "amber", "blue", "clay", "gold", "green", "sand"];
export const toneAt = (i: number): Tone => TONE_CYCLE[((i % TONE_CYCLE.length) + TONE_CYCLE.length) % TONE_CYCLE.length]!;

/** A tint as a translucent colour for the glass effect (the pastel background at about 60% strength). */
export const glassTint = (tone: Tone) => `${Tints[tone].bg}99`;

/** Task priorities 1–4, coloured like the web's priority flags. */
export const PriorityColor: Record<number, string> = {
  1: Palette.rec,
  2: Palette.orangeFg,
  3: Tints.blue.fg,
  4: Palette.fgFaint,
};

export const Radius = { r1: 10, r2: 14, r3: 20, r4: 28, r5: 36, pill: 999 } as const;
export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/**
 * Font styles to spread into a StyleSheet: Geist for UI, Instrument Serif for display, as on the web.
 * The family names match the fonts registered in the root layout.
 */
export const Font = {
  serif: { fontFamily: "InstrumentSerif_400Regular" },
  serifItalic: { fontFamily: "InstrumentSerif_400Regular_Italic" },
  sans: { fontFamily: "Geist_400Regular" },
  sansMedium: { fontFamily: "Geist_500Medium" },
  sansSemi: { fontFamily: "Geist_600SemiBold" },
  // System monospace (the web uses Geist Mono for code); no extra font to download.
  mono: { fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }) },
} as const;

/** Soft drop shadows (--e1…--e3). */
export const Shadow = {
  e1: { shadowColor: Palette.shadow, shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  e2: { shadowColor: Palette.shadow, shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
} as const;

export const MaxContentWidth = 640;
