import type { Note } from "@untitled/types";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { NoteForm } from "./NoteForm";
import { useNote } from "./queries";
import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { BarButton, DetailBar } from "@/components/ui/DetailBar";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { Screen } from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Palette, Radius, Tints } from "@/constants/theme";
import { errorMessage } from "@/lib/api";

export function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteQ = useNote(id);
  if (id === "new") return <NoteForm id="new" />;
  if (noteQ.isError)
    return (
      <Screen>
        <ErrorState message={errorMessage(noteQ.error)} onRetry={() => void noteQ.refetch()} />
      </Screen>
    );
  if (!noteQ.data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  return <NoteScreen note={noteQ.data} />;
}

/** An existing note opens as a rendered page; the writing page only appears after tapping Edit, and saving returns to the page. */
function NoteScreen({ note }: { note: Note }) {
  const [editing, setEditing] = useState(false);
  // Mounting the form only when editing starts lets it begin from the latest saved values without syncing state in an effect.
  if (editing) return <NoteForm id={note.id} note={note} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />;
  return <NoteView note={note} onEdit={() => setEditing(true)} />;
}

function NoteView({ note, onEdit }: { note: Note; onEdit: () => void }) {
  const tint = note.color ? Tints[note.color] : null;
  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <DetailBar label="Note" onClose={() => router.back()} action={<BarButton title="Edit" onPress={onEdit} />} />
      <View style={[styles.page, tint ? { backgroundColor: tint.bg, borderColor: tint.line } : null]}>
        <View style={styles.titleRow}>
          <AppText variant="title" style={styles.flex}>
            {note.title || "Untitled"}
          </AppText>
          {note.pinned ? <Icon name="thumbtack" size={14} color={tint?.fg ?? Palette.fgSubtle} /> : null}
        </View>
        <AppText variant="small" color={Palette.fgSubtle}>
          Updated {new Date(note.updated_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </AppText>
        {note.body ? <Markdown text={note.body} /> : null}
        <AttachmentGallery attachments={note.attachments} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 12, padding: 4, borderRadius: Radius.r3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  flex: { flex: 1 },
});
