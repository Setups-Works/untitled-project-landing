import type { JournalEntry, Tone } from "@untitled/types";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { Font, Palette, Radius, Space } from "@/constants/theme";
import { timeOf } from "@/lib/dates";

const words = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/**
 * One entry in the day's feed, on a tinted glass card (its colour comes from the list, so neighbours differ, as on the web): the time in the display serif, a hairline that runs to the edge with the word
 * count, then the text in the serif and any pictures or voice notes. Tap the entry to open it; the menu has Edit and Delete.
 */
export function FeedEntry({ entry, tone, onOpen, onMenu }: { entry: JournalEntry; tone: Tone; onOpen: () => void; onMenu: () => void }) {
  const count = words(entry.body);
  return (
    <Card tone={tone} style={styles.entry}>
      <View style={styles.head}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open journal entry at ${timeOf(entry.created_at)}`}
          onPress={onOpen}
          style={styles.open}
        >
          <AppText style={styles.time}>{timeOf(entry.created_at)}</AppText>
          <View style={styles.rule} />
          {count ? (
            <AppText variant="label" color={Palette.fgFaint} style={styles.count}>
              {count} W
            </AppText>
          ) : null}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Entry actions" hitSlop={8} onPress={onMenu} style={styles.menu}>
          <Icon name="ellipsis" size={16} color={Palette.fgSubtle} />
        </Pressable>
      </View>
      {entry.body ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Open journal entry" onPress={onOpen}>
          <Markdown text={entry.body} serif />
        </Pressable>
      ) : null}
      <AttachmentGallery attachments={entry.attachments} />
    </Card>
  );
}

const styles = StyleSheet.create({
  entry: { gap: Space.md, padding: Space.lg, borderRadius: Radius.r3 },
  head: { flexDirection: "row", alignItems: "center", gap: Space.sm },
  open: { flex: 1, flexDirection: "row", alignItems: "center", gap: Space.md },
  time: { ...Font.serif, fontSize: 30, lineHeight: 34, letterSpacing: -0.5, color: Palette.fg },
  rule: { flex: 1, height: StyleSheet.hairlineWidth * 2, backgroundColor: Palette.lineStrong },
  count: { ...Font.mono },
  menu: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
});
