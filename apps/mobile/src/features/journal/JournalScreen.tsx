import type { JournalEntry } from "@untitled/types";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet } from "react-native";

import { useJournal, useJournalActions } from "./queries";
import { AppText } from "@/components/ui/AppText";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { TextField } from "@/components/ui/TextField";
import { Palette, toneAt } from "@/constants/theme";
import { errorMessage } from "@/lib/api";
import { dayLabel, isoDate, longDate, timeOf } from "@/lib/dates";

export function JournalScreen() {
  const journalQ = useJournal();
  const { create, remove } = useJournalActions();
  const today = useMemo(() => isoDate(), []);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await journalQ.refetch();
    setRefreshing(false);
  }, [journalQ]);

  function addEntry() {
    const body = draft.trim();
    if (!body) return;
    setError("");
    create.mutate(
      { entry_date: today, body },
      { onSuccess: () => setDraft(""), onError: (e) => setError(errorMessage(e, "Couldn’t save that entry.")) },
    );
  }

  // Newest day first, entries within a day newest first (the server already orders them this way).
  const days = useMemo(() => {
    const groups = new Map<string, JournalEntry[]>();
    for (const e of journalQ.data ?? []) groups.set(e.entry_date, [...(groups.get(e.entry_date) ?? []), e]);
    return [...groups.entries()];
  }, [journalQ.data]);

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <AppText variant="title" accessibilityRole="header">
        Journal
      </AppText>
      <Card tone="amber">
        <TextField
          label={`Today · ${longDate()}`}
          value={draft}
          onChangeText={setDraft}
          multiline
          minHeight={96}
          placeholder="How is today going?"
        />
        {error ? <Banner kind="error">{error}</Banner> : null}
        <Button title="Add entry" icon="plus" loading={create.isPending} disabled={!draft.trim()} onPress={addEntry} style={styles.add} />
      </Card>

      {journalQ.isPending ? (
        <LoadingState />
      ) : journalQ.isError ? (
        <ErrorState message={errorMessage(journalQ.error)} onRetry={() => void journalQ.refetch()} />
      ) : days.length ? (
        days.map(([date, entries], i) => (
          <Card key={date} tone={toneAt(i)} style={styles.day}>
            <AppText variant="label">{dayLabel(date, today)}</AppText>
            {entries.map((e) => (
              <SwipeToDelete
                key={e.id}
                title="Delete this entry?"
                message="This can’t be undone."
                what="journal entry"
                onDelete={() => remove.mutate(e.id, { onError: (err) => Alert.alert("Couldn’t delete", errorMessage(err)) })}
              >
                <Card
                  onPress={() => router.push({ pathname: "/journal/[id]", params: { id: e.id } })}
                  accessibilityLabel={`Journal entry at ${timeOf(e.created_at)}`}
                >
                  <AppText variant="small" color={Palette.fgSubtle}>
                    {timeOf(e.created_at)}
                  </AppText>
                  <AppText variant="body" numberOfLines={4}>
                    {e.body || (e.attachments.length ? "" : "Empty entry")}
                  </AppText>
                  <AttachmentGallery attachments={e.attachments} />
                </Card>
              </SwipeToDelete>
            ))}
          </Card>
        ))
      ) : (
        <EmptyState icon="book-open" title="Your journal is empty" hint="Write a line above. One sentence is enough." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  add: { marginTop: 12 },
  day: { gap: 10 },
});
