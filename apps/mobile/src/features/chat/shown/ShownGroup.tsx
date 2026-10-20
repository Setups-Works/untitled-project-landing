import type { Tone } from "@untitled/types";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Palette, Radius, Space, Tints } from "@/constants/theme";

/**
 * One group of cards a chat reply asked the app to show: a tinted glass card with a title, the items, and an Open button that goes to
 * the real screen. The tint is the one that area wears everywhere (journal violet, to-dos amber, notes blue, health mint).
 */
export function ShownGroup({
  tone,
  icon,
  title,
  openLabel,
  onOpen,
  note,
  children,
}: {
  tone: Tone;
  icon: IconName;
  title: string;
  openLabel: string;
  onOpen: () => void;
  /** A small line under the items, for example "2 more". */
  note?: string;
  children: ReactNode;
}) {
  const t = Tints[tone];
  return (
    <Card tone={tone} style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.badge, { borderColor: t.line }]}>
          <Icon name={icon} size={13} color={t.fg} />
        </View>
        <AppText variant="label" color={t.fg}>
          {title.toUpperCase()}
        </AppText>
      </View>
      <View style={styles.rows}>{children}</View>
      {note ? <AppText variant="small">{note}</AppText> : null}
      <Button title={openLabel} kind="secondary" onPress={onOpen} />
    </Card>
  );
}

/** One row: a glass strip with the item's text; tapping it opens that item. */
export function ShownRow({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      {children}
    </Pressable>
  );
}

export const ShownEmpty = ({ children }: { children: string }) => (
  <View style={styles.row}>
    <AppText variant="small">{children}</AppText>
  </View>
);

const styles = StyleSheet.create({
  card: { gap: Space.sm, padding: Space.md, borderRadius: Radius.r3 },
  head: { flexDirection: "row", alignItems: "center", gap: Space.sm },
  badge: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.glassHi,
    borderWidth: 1,
  },
  rows: { gap: Space.sm },
  row: { gap: 2, paddingHorizontal: Space.md, paddingVertical: Space.sm, borderRadius: Radius.r2, backgroundColor: Palette.glassHi },
  pressed: { opacity: 0.8 },
});
