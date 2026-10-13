import type { Tone } from "@untitled/types";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { glassTint, Palette, Radius, Shadow, Tints } from "@/constants/theme";

type Props = { children: ReactNode; tone?: Tone | null; style?: StyleProp<ViewStyle>; liquidTint?: boolean; accessibilityLabel?: string };

/** Shared mobile equivalent of web `.ap-card`: translucent glass, a soft ring, and the same optional tint tokens. */
export function GlassSurface({ children, tone, style, liquidTint, accessibilityLabel }: Props) {
  const t = tone ? Tints[tone] : null;
  const liquid = Platform.OS === "ios" && isLiquidGlassAvailable();

  if (liquid && (!tone || liquidTint))
    return (
      <GlassView
        glassEffectStyle="regular"
        tintColor={tone ? glassTint(tone) : undefined}
        accessibilityLabel={accessibilityLabel}
        style={[styles.base, { borderColor: t?.line ?? Palette.glassRing, borderWidth: 1 }, style]}
      >
        {children}
      </GlassView>
    );

  const bg = t?.bg ?? (Platform.OS === "android" ? Palette.glassAndroid : Palette.glass);
  const baseStyle = Platform.OS === "android" ? styles.baseAndroid : styles.base;

  // On Android:
  // - The glassRing border (rgba white 0.85) is invisible against a white-ish card background.
  //   Use Palette.line (a dark-tinted hairline, the same as the web card border) instead.
  // - Shadow.e1 elevation gets clipped to nothing by overflow:"hidden" on parent tinted cards.
  //   Drop it; the visible border already defines the card boundary.
  const ring = Platform.OS === "android" && !t
    ? { borderColor: Palette.line, borderWidth: 1 }
    : { borderColor: t?.line ?? Palette.glassRing, borderWidth: 1 };
  const shadow = !t && Platform.OS !== "android" ? Shadow.e1 : null;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[baseStyle, ring, { backgroundColor: bg }, shadow, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // iOS: overflow:hidden clips liquid-glass children correctly.
  base: { borderRadius: Radius.r3, overflow: "hidden" },
  // Android: borderRadius clips children natively; overflow:hidden suppresses elevation/shadow.
  baseAndroid: { borderRadius: Radius.r3 },
});
