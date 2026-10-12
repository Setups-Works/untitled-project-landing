import type { Note } from "@untitled/types";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { useNoteActions, useNotes } from "./queries";
import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { TextField } from "@/components/ui/TextField";
import { Palette, Tints, toneAt } from "@/constants/theme";
import { errorMessage } from "@/lib/api";

const open = (id: string) => router.push({ pathname: "/note/[id]", params: { id } });

export function NotesScreen() {
  const notesQ = useNotes();
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await notesQ.refetch();
    setRefreshing(false);
  }, [notesQ]);

  const notes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = notesQ.data ?? [];
    return q ? all.filter((n) => `${n.title} ${n.body}`.toLowerCase().includes(q)) : all;
  }, [notesQ.data, query]);

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.head}>
        <AppText variant="title" accessibilityRole="header">
          Notes
        </AppText>
        <Button title="New" icon="plus" onPress={() => open("new")} />
      </View>
      {notesQ.data?.length ? (
        <TextField label="Search notes" value={query} onChangeText={setQuery} placeholder="Search…" returnKeyType="search" />
      ) : null}

      {notesQ.isPending ? (
        <LoadingState />
      ) : notesQ.isError ? (
        <ErrorState message={errorMessage(notesQ.error)} onRetry={() => void notesQ.refetch()} />
      ) : notes.length ? (
        notes.map((n, i) => <NoteCard key={n.id} note={n} index={i} />)
      ) : query ? (
        <EmptyState icon="magnifying-glass" title="No matches" hint="Try a different search." />
      ) : (
        <EmptyState
          icon="note-sticky"
          title="No notes yet"
          hint="Capture an idea, a link, anything you want to keep."
          action={{ title: "New note", onPress: () => open("new") }}
        />
      )}
    </Screen>
  );
}

function NoteCard({ note, index }: { note: Note; index: number }) {
  const { remove } = useNoteActions();
  return (
    <SwipeToDelete
      title="Delete this note?"
      message="This can’t be undone."
      what={note.title || "note"}
      onDelete={() => remove.mutate(note.id, { onError: (e) => Alert.alert("Couldn’t delete", errorMessage(e)) })}
    >
      <Card tone={note.color ?? toneAt(index)} onPress={() => open(note.id)} accessibilityLabel={`Note: ${note.title || "Untitled"}`}>
        <View style={styles.cardTop}>
          <AppText variant="heading" numberOfLines={1} style={styles.flex}>
            {note.title || "Untitled"}
          </AppText>
          {note.pinned ? <Icon name="thumbtack" size={13} color={note.color ? Tints[note.color].fg : Palette.fgSubtle} /> : null}
        </View>
        {note.body ? (
          <AppText variant="small" numberOfLines={3} color={Palette.fgMuted}>
            {note.body}
          </AppText>
        ) : null}
        {/* One preview keeps the list light; the editor shows them all. */}
        <AttachmentGallery attachments={note.attachments.slice(0, 1)} />
      </Card>
    </SwipeToDelete>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  flex: { flex: 1 },
});
