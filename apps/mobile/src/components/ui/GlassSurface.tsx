import type { Tone } from "@untitled/types";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { glassTint, Palette, Radius, Shadow, Tints } from "@/constants/theme";

// Native iOS glass can take the same tint tokens as the web; other platforms use the matching pastel fill.
const liquid = Platform.OS === "ios" && isLiquidGlassAvailable();

type Props = { children: ReactNode; tone?: Tone | null; style?: StyleProp<ViewStyle>; interactive?: boolean; liquidTint?: boolean; accessibilityLabel?: string };

/** The app's glass material (the web's `liquid-*` tokens), tinted with one of the product's colours. */
export function GlassSurface({ children, tone, style, interactive, liquidTint, accessibilityLabel }: Props) {
  const t = tone ? Tints[tone] : null;
  const ring = { borderColor: t?.line ?? Palette.glassRing, borderWidth: 1 };
  if (liquid && (!tone || liquidTint))
    return (
      <GlassView
        glassEffectStyle="regular"
        tintColor={tone ? glassTint(tone) : undefined}
        isInteractive={interactive}
        accessibilityLabel={accessibilityLabel}
        style={[styles.base, ring, style]}
      >
        {children}
      </GlassView>
    );
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.base, ring, { backgroundColor: t?.bg ?? Palette.glassHi }, Shadow.e1, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ base: { borderRadius: Radius.r3, overflow: "hidden" } });
