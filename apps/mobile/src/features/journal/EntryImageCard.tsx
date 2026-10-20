import { ENTRY_CARD as C, plainEntryText } from "@untitled/logic";
import type { JournalEntry } from "@untitled/types";
import { forwardRef } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Font, Palette, Space, Tints } from "@/constants/theme";
import { dayLabel, timeOf } from "@/lib/dates";

/**
 * A journal entry as a picture: a violet card with the day, the time in the serif, a hairline, the text and the app's name. Same numbers
 * and plain text as the web's card (packages/logic/src/entryCard.ts). It is shown as a preview and snapshotted when the person shares.
 */
export const EntryImageCard = forwardRef<View, { entry: JournalEntry }>(function EntryImageCard({ entry }, ref) {
  const t = Tints.violet;
  return (
    <View ref={ref} collapsable={false} style={[styles.card, { backgroundColor: t.bg }]}>
      <AppText variant="small" color={Palette.fgSubtle}>
        {dayLabel(entry.entry_date)}
      </AppText>
      <View style={styles.timeRow}>
        <AppText style={styles.time}>{timeOf(entry.created_at)}</AppText>
        <View style={[styles.rule, { backgroundColor: t.fg }]} />
      </View>
      <AppText style={styles.body} numberOfLines={C.maxLines}>
        {plainEntryText(entry.body)}
      </AppText>
      <AppText variant="label" color={Palette.fgSubtle} style={styles.brand}>
        {C.brand}
      </AppText>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { width: "100%", gap: Space.md, padding: Space.xl },
  timeRow: { flexDirection: "row", alignItems: "center", gap: Space.md },
  time: { ...Font.serif, fontSize: 34, lineHeight: 38, color: Palette.fg },
  rule: { flex: 1, height: StyleSheet.hairlineWidth * 2, opacity: 0.35 },
  body: { ...Font.serif, fontSize: 22, lineHeight: 32, color: Palette.fg },
  brand: { ...Font.mono, paddingTop: Space.sm },
});
