import * as Haptics from "expo-haptics";
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText } from "./AppText";
import { Icon, type IconName } from "./Icon";
import { Palette, Radius, Shadow } from "@/constants/theme";

type Kind = "primary" | "secondary" | "ghost" | "danger" | "dangerSolid";

type Props = {
  title: string;
  onPress: () => void;
  kind?: Kind;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const palette: Record<Kind, { bg: string; fg: string; ring?: string }> = {
  primary: { bg: Palette.fillDark, fg: Palette.onDark },
  secondary: { bg: Palette.glassHi, fg: Palette.fg, ring: Palette.glassRing },
  ghost: { bg: "transparent", fg: Palette.greenFg },
  danger: { bg: Palette.clayBg, fg: Palette.clayFg },
  dangerSolid: { bg: Palette.clayFg, fg: Palette.onDark },
};

/** Pill button with a 48 pt touch target. */
export function Button({ title, onPress, kind = "primary", icon, loading, disabled, style, accessibilityHint }: Props) {
  const c = palette[kind];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: c.bg, opacity: inactive ? 0.55 : pressed ? 0.85 : 1 },
        c.ring ? { borderColor: c.ring, borderWidth: 1 } : null,
        kind === "secondary" || kind === "primary" ? Shadow.e1 : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={15} color={c.fg} /> : null}
          <AppText variant="bodyStrong" color={c.fg}>
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, borderRadius: Radius.pill, paddingHorizontal: 22, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
