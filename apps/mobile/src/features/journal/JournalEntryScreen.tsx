import type { JournalEntry } from "@untitled/types";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { EntryEditSheet } from "./EntryEditSheet";
import { EntryShareSheet } from "./EntryShareSheet";
import { useJournalEntry } from "./queries";
import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { BarButton, DetailBar } from "@/components/ui/DetailBar";
import { Markdown } from "@/components/ui/Markdown";
import { Screen } from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Palette, Radius, Tints } from "@/constants/theme";
import { errorMessage } from "@/lib/api";
import { dayLabel, timeOf } from "@/lib/dates";

export function JournalEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entryQ = useJournalEntry(id);
  if (entryQ.isError)
    return (
      <Screen>
        <ErrorState message={errorMessage(entryQ.error)} onRetry={() => void entryQ.refetch()} />
      </Screen>
    );
  if (!entryQ.data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  return <EntryScreen entry={entryQ.data} />;
}

/** An entry opens as a rendered page in a sheet, like a note; the writing page only appears after tapping Edit, and saving returns here. */
function EntryScreen({ entry }: { entry: JournalEntry }) {
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  // Mounting the editor only when editing starts lets it begin from the latest saved entry without syncing state in an effect.
  if (editing)
    return (
      <EntryEditSheet
        embedded
        entry={entry}
        onClose={() => setEditing(false)}
        onSaved={() => setEditing(false)}
        onDeleted={() => router.back()}
      />
    );
  const tint = Tints.violet;
  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <DetailBar
        label="Journal"
        onClose={() => router.back()}
        action={
          <View style={styles.actions}>
            <BarButton title="Share" onPress={() => setSharing(true)} />
            <BarButton title="Edit" onPress={() => setEditing(true)} />
          </View>
        }
      />
      <View style={[styles.page, { backgroundColor: tint.bg, borderColor: tint.line }]}>
        <AppText variant="title">{dayLabel(entry.entry_date)}</AppText>
        <AppText variant="small" color={Palette.fgSubtle}>
          {timeOf(entry.created_at)}
          {entry.updated_at !== entry.created_at ? ` · edited ${timeOf(entry.updated_at)}` : ""}
        </AppText>
        {entry.body ? <Markdown text={entry.body} /> : null}
        <AttachmentGallery attachments={entry.attachments} />
      </View>
      {sharing ? <EntryShareSheet entry={entry} onClose={() => setSharing(false)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", alignItems: "center", gap: 16 },
  page: { gap: 12, padding: 16, borderRadius: Radius.r3, borderWidth: 1 },
});
