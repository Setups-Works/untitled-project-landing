import type { Tone } from "@untitled/types";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { GlassSurface } from "./GlassSurface";
import { Radius } from "@/constants/theme";

type Props = {
  children: React.ReactNode;
  tone?: Tone | null;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Liquid-glass card, tinted like the web's `at-<tint>`. Tap targets keep their glass and just dim while pressed. */
export function Card({ children, tone, onPress, style, accessibilityLabel }: Props) {
  if (!onPress)
    return (
      <GlassSurface tone={tone} style={[styles.card, style]} accessibilityLabel={accessibilityLabel}>
        {children}
      </GlassSurface>
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.press, pressed ? { opacity: 0.85 } : null]}
    >
      <GlassSurface tone={tone} style={[styles.card, style]}>
        {children}
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  press: { borderRadius: Radius.r3 },
});
