import { personName } from "@untitled/logic";
import type { SharedJournalEntry } from "@untitled/types";
import { Pressable, StyleSheet, View } from "react-native";

import { PersonBadge } from "./PersonBadge";
import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Card } from "@/components/ui/Card";
import { Markdown } from "@/components/ui/Markdown";
import { Palette } from "@/constants/theme";
import { timeOf } from "@/lib/dates";

/** One entry in a shared journal: who wrote it and when, its text and files, and edit / delete for the people allowed to. */
export function EntryCard({
  entry,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  entry: SharedJournalEntry;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <PersonBadge person={entry.author} size="sm" />
        <View style={styles.who}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {personName(entry.author)}
          </AppText>
          <AppText variant="small">{timeOf(entry.created_at)}</AppText>
        </View>
        {canEdit ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Edit entry" hitSlop={10} onPress={onEdit}>
            <AppText variant="bodyStrong" color={Palette.greenFg}>
              Edit
            </AppText>
          </Pressable>
        ) : null}
        {canDelete ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Delete entry" hitSlop={10} onPress={onDelete}>
            <AppText variant="bodyStrong" color={Palette.clayFg}>
              Delete
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {entry.body ? <Markdown text={entry.body} /> : null}
      <AttachmentGallery attachments={entry.attachments} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  who: { flex: 1 },
});
