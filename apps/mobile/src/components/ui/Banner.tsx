import { StyleSheet, View } from "react-native";

import { AppText } from "./AppText";
import { Icon } from "./Icon";
import { Palette, Radius } from "@/constants/theme";

type Kind = "error" | "success" | "info";
const look: Record<Kind, { bg: string; fg: string; icon: "circle-exclamation" | "circle-check" | "circle-info" }> = {
  error: { bg: Palette.clayBg, fg: Palette.clayFg, icon: "circle-exclamation" },
  success: { bg: Palette.greenBg, fg: Palette.greenFg, icon: "circle-check" },
  info: { bg: Palette.surfaceMuted, fg: Palette.fgMuted, icon: "circle-info" },
};

export function Banner({ kind = "info", children }: { kind?: Kind; children: string }) {
  const l = look[kind];
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.box, { backgroundColor: l.bg }]}>
      <Icon name={l.icon} size={15} color={l.fg} />
      <AppText variant="small" color={l.fg} style={styles.text}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 12, borderRadius: Radius.r2 },
  text: { flex: 1 },
});
