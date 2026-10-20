import { canWrite, groupByDay, MAX_UPLOAD_BYTES, SHARED_JOURNAL as LIMIT } from "@untitled/logic";
import type { SharedJournalEntry } from "@untitled/types";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useCollaborationActions, useJournalEntries, useSharedJournal } from "./queries";
import { EntryCard } from "./components/EntryCard";
import { EntryEditSheet } from "./components/EntryEditSheet";
import { ManageSheet } from "./components/ManageSheet";
import { RolePill } from "./components/RolePill";
import { uploadSharedJournalFile } from "./files";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { EntryEditor } from "@/components/ui/EntryEditor";
import { useConfirm } from "@/components/ui/Confirm";
import { BarButton, DetailBar } from "@/components/ui/DetailBar";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { pickFiles, type PendingFile } from "@/features/chat/files";
import { errorMessage } from "@/lib/api";
import { dayLabel, isoDate, timeOf } from "@/lib/dates";

/** A shared journal: the feed everyone in it can read, and a box to write in it for owners and editors. */
export function SharedJournalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const journalQ = useSharedJournal(id);
  const feedQ = useJournalEntries(id);
  const act = useCollaborationActions();
  const { ask, dialog } = useConfirm();
  const [err, setErr] = useState("");
  const [people, setPeople] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // The same writing page as the Journal: one for a new entry, one for changing an entry you wrote.
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<SharedJournalEntry | null>(null);

  const journal = journalQ.data;
  const entries = useMemo(() => feedQ.data?.pages.flatMap((p) => p.entries) ?? [], [feedQ.data]);
  const days = useMemo(() => groupByDay(entries), [entries]);
  const writer = journal ? canWrite(journal.role) : false;
  const owner = journal?.role === "owner";

  async function refresh() {
    setRefreshing(true);
    await Promise.all([journalQ.refetch(), feedQ.refetch()]);
    setRefreshing(false);
  }

  async function attach(type?: string) {
    try {
      const { files: picked, tooBig } = await pickFiles(type);
      setErr(tooBig ? `Files can be up to ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` : "");
      setFiles((cur) => [...cur, ...picked].slice(0, LIMIT.attachmentsMax));
    } catch (e) {
      setErr(errorMessage(e, "Couldn’t open your files."));
    }
  }

  async function send() {
    if (!journal) return;
    setErr("");
    setSaving(true);
    try {
      const body = draft.trim();
      const attachments = await Promise.all(files.map((f) => uploadSharedJournalFile(journal.me, id, f)));
      const voiceOnly = !body && attachments.every((a) => a.type.startsWith("audio/"));
      await act.addEntry.mutateAsync({ id, entry: { entry_date: isoDate(), body, kind: voiceOnly ? "voice" : "text", attachments } });
      setDraft("");
      setFiles([]);
      setComposing(false);
    } catch (e) {
      setErr(errorMessage(e, "Couldn’t save that entry."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(entryId: string, createdAt: string) {
    const yes = await ask({
      title: "Delete this entry?",
      body: `The entry from ${timeOf(createdAt)} and its attachments will be permanently deleted for everyone.`,
      confirmLabel: "Delete entry",
      danger: true,
    });
    if (yes) act.removeEntry.mutate({ id, entryId }, { onError: (e) => setErr(errorMessage(e, "Couldn’t delete that entry.")) });
  }

  if (journalQ.isError)
    return (
      <Screen edges={["top", "left", "right", "bottom"]}>
        <DetailBar label="Shared journal" closeLabel="Back" onClose={() => router.back()} />
        <ErrorState message={errorMessage(journalQ.error)} onRetry={() => void journalQ.refetch()} />
      </Screen>
    );

  return (
    <Screen edges={["top", "left", "right", "bottom"]} onRefresh={() => void refresh()} refreshing={refreshing}>
      <DetailBar
        label="Shared journal"
        closeLabel="Back"
        onClose={() => router.back()}
        action={journal ? <BarButton title={owner ? "Manage" : "People"} onPress={() => setPeople(true)} /> : undefined}
      />
      {journal ? (
        <View style={styles.title}>
          <AppText variant="title" style={styles.name}>
            {journal.name}
          </AppText>
          <RolePill role={journal.role} />
        </View>
      ) : null}
      {journal ? (
        <AppText variant="small">
          {journal.member_count} {journal.member_count === 1 ? "person" : "people"} · {journal.entry_count}{" "}
          {journal.entry_count === 1 ? "entry" : "entries"}
        </AppText>
      ) : null}
      {err ? <Banner kind="error">{err}</Banner> : null}

      {writer ? (
        <Button title="New entry" icon="pen" onPress={() => setComposing(true)} />
      ) : journal ? (
        <Banner kind="info">You can read this journal. Only editors and the owner can write in it.</Banner>
      ) : null}

      {journalQ.isPending || feedQ.isPending ? (
        <LoadingState />
      ) : entries.length === 0 ? (
        <EmptyState
          icon="book-open"
          title="Nothing here yet"
          hint={writer ? "Write the first entry above." : "Entries will show up here."}
        />
      ) : (
        days.map((day) => (
          <View key={day.date} style={styles.day}>
            <AppText variant="label">{dayLabel(day.date).toUpperCase()}</AppText>
            {day.entries.map((e) => {
              const mine = e.author.id === journal?.me;
              return (
                <EntryCard
                  key={e.id}
                  entry={e}
                  canEdit={mine && writer}
                  canDelete={(mine && writer) || owner}
                  onEdit={() => setEditing(e)}
                  onDelete={() => void remove(e.id, e.created_at)}
                />
              );
            })}
          </View>
        ))
      )}
      {feedQ.hasNextPage ? (
        <Button title="Show earlier days" kind="secondary" loading={feedQ.isFetchingNextPage} onPress={() => void feedQ.fetchNextPage()} />
      ) : null}

      <EntryEditor
        visible={composing}
        label={journal ? `New entry · ${journal.name}` : "New entry"}
        inputLabel="New entry"
        draft={draft}
        onDraft={setDraft}
        files={files}
        onRemoveFile={(i) => setFiles((cur) => cur.filter((_, j) => j !== i))}
        onPickImages={() => void attach("image/*")}
        onPickFiles={() => void attach()}
        canSave={(draft.trim().length > 0 || files.length > 0) && !saving}
        saving={saving}
        error={err}
        onSave={() => void send()}
        onClose={() => setComposing(false)}
      />
      {editing && journal ? (
        <EntryEditSheet key={editing.id} journalId={id} userId={journal.me} entry={editing} onClose={() => setEditing(null)} />
      ) : null}
      <ManageSheet id={people ? id : null} onClose={() => setPeople(false)} />
      {dialog}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  name: { flex: 1 },
  day: { gap: 10 },
});
