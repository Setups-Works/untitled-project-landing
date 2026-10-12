import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { Tone } from "@untitled/types";

import { Palette, Radius, Shadow, Tints } from "@/constants/theme";

type Props = {
  children: React.ReactNode;
  tone?: Tone | null;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Frosted-glass card (`ap-card`), optionally tinted like the web's `at-<tint>`. */
export function Card({ children, tone, onPress, style, accessibilityLabel }: Props) {
  const t = tone ? Tints[tone] : null;
  const look = [styles.card, { backgroundColor: t?.bg ?? Palette.glassHi, borderColor: t?.line ?? Palette.glassRing }, Shadow.e1, style];
  if (!onPress) return <View style={look}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [look, pressed ? { opacity: 0.85 } : null]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.r3, borderWidth: 1, padding: 16 },
});
