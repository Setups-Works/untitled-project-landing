import type { WidgetTheme } from "@untitled/logic";

import { Palette, Tints } from "@/constants/theme";

/** The widgets' colours, built from the app's own design tokens in one place (widgets can't import tokens; the app hands them over). */
export const widgetTheme: WidgetTheme = {
  page: Palette.page,
  surface: Palette.surface,
  fg: Palette.fg,
  fgMuted: Palette.fgMuted,
  fgSubtle: Palette.fgSubtle,
  accent: Palette.fillDark,
  onAccent: Palette.onDark,
  tones: {
    tasks: { bg: Tints.blue.bg, fg: Tints.blue.fg },
    quick: { bg: Tints.sand.bg, fg: Tints.sand.fg },
    health: { bg: Tints.mint.bg, fg: Tints.mint.fg },
    journal: { bg: Tints.violet.bg, fg: Tints.violet.fg },
  },
};
