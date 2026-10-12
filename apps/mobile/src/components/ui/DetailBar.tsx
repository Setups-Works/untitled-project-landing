import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "./AppText";
import { Palette } from "@/constants/theme";

/** Top row of a detail page: Close on the left, a small label in the middle, and an action (usually Edit) on the right. */
export function DetailBar({
  label,
  onClose,
  closeLabel = "Close",
  action,
}: {
  label: string;
  onClose: () => void;
  closeLabel?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} hitSlop={12} onPress={onClose} style={styles.side}>
        <AppText variant="bodyStrong" color={Palette.fgMuted}>
          {closeLabel}
        </AppText>
      </Pressable>
      <AppText variant="label">{label}</AppText>
      <View style={[styles.side, styles.right]}>{action}</View>
    </View>
  );
}

/** The text button used for "Edit". */
export function BarButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} hitSlop={12} onPress={onPress}>
      <AppText variant="bodyStrong" color={Palette.greenFg}>
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 36 },
  side: { minWidth: 64 },
  right: { alignItems: "flex-end" },
});
