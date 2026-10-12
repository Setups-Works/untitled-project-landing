import type { JournalEntry } from "@untitled/types";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { useJournalActions, useJournalEntry } from "./queries";
import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Banner } from "@/components/ui/Banner";
import { BarButton, DetailBar } from "@/components/ui/DetailBar";
import { Markdown } from "@/components/ui/Markdown";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { TextField } from "@/components/ui/TextField";
import { Palette } from "@/constants/theme";
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

/** An entry opens as a rendered page; the editor only appears after tapping Edit, and saving returns to the page. */
function EntryScreen({ entry }: { entry: JournalEntry }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <EntryForm entry={entry} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />;
  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <DetailBar
        label={`${dayLabel(entry.entry_date)} · ${timeOf(entry.created_at)}`}
        onClose={() => router.back()}
        action={<BarButton title="Edit" onPress={() => setEditing(true)} />}
      />
      {entry.body ? <Markdown text={entry.body} /> : null}
      <AttachmentGallery attachments={entry.attachments} />
    </Screen>
  );
}

function EntryForm({ entry, onSaved, onCancel }: { entry: JournalEntry; onSaved?: () => void; onCancel?: () => void }) {
  const { update, remove } = useJournalActions();
  const [body, setBody] = useState(entry.body);
  const [error, setError] = useState("");
  const id = entry.id;

  function save() {
    setError("");
    update.mutate(
      { id, body },
      { onSuccess: () => (onSaved ? onSaved() : router.back()), onError: (e) => setError(errorMessage(e, "Couldn’t save the entry.")) },
    );
  }

  function confirmDelete() {
    Alert.alert("Delete this entry?", "This can’t be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => remove.mutate(id, { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) }),
      },
    ]);
  }

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={onCancel ? "Cancel" : "Close"}
          hitSlop={12}
          onPress={() => (onCancel ? onCancel() : router.back())}
        >
          <AppText variant="bodyStrong" color={Palette.fgMuted}>
            {onCancel ? "Cancel" : "Close"}
          </AppText>
        </Pressable>
        <AppText variant="label">
          {dayLabel(entry.entry_date)} · {timeOf(entry.created_at)}
        </AppText>
        <View style={styles.spacer} />
      </View>
      <AttachmentGallery attachments={entry.attachments} />
      <TextField label="Entry" value={body} onChangeText={setBody} multiline minHeight={260} />
      {error ? <Banner kind="error">{error}</Banner> : null}
      <Button title="Save changes" loading={update.isPending} disabled={remove.isPending} onPress={save} />
      <Button
        title="Delete entry"
        kind="danger"
        icon="trash"
        loading={remove.isPending}
        disabled={update.isPending}
        onPress={confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 36 },
  spacer: { width: 40 },
});
