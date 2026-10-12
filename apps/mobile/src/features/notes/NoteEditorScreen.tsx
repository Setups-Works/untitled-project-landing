import type { Note, Tone } from "@untitled/types";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { useNote, useNoteActions } from "./queries";
import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Banner } from "@/components/ui/Banner";
import { BarButton, DetailBar } from "@/components/ui/DetailBar";
import { Markdown } from "@/components/ui/Markdown";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { TextField } from "@/components/ui/TextField";
import { Palette, Radius, Tints } from "@/constants/theme";
import { errorMessage } from "@/lib/api";

const TONES = Object.keys(Tints) as Tone[];

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

/** An existing note opens as a rendered page; the form only appears after tapping Edit, and saving returns to the page. */
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

function NoteForm({ id, note, onSaved, onCancel }: { id: string; note?: Note; onSaved?: () => void; onCancel?: () => void }) {
  const isNew = id === "new";
  const { create, update, remove } = useNoteActions();
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [color, setColor] = useState<Tone | null>(note?.color ?? null);
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [error, setError] = useState("");

  const busy = create.isPending || update.isPending || remove.isPending;

  function save() {
    setError("");
    const values = { title: title.trim(), body, color, pinned };
    if (!values.title && !values.body.trim()) return setError("Add a title or some text first.");
    const done = {
      onSuccess: () => (onSaved ? onSaved() : router.back()),
      onError: (e: unknown) => setError(errorMessage(e, "Couldn’t save the note.")),
    };
    if (isNew) create.mutate(values, done);
    else update.mutate({ id, ...values }, done);
  }

  function confirmDelete() {
    Alert.alert("Delete this note?", "This can’t be undone.", [
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
        <AppText variant="label">{isNew ? "New note" : "Edit note"}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={pinned ? "Unpin note" : "Pin note"}
          hitSlop={12}
          onPress={() => setPinned((p) => !p)}
        >
          <Icon name="thumbtack" size={16} color={pinned ? Palette.greenFg : Palette.fgFaint} />
        </Pressable>
      </View>

      <TextField label="Title" value={title} onChangeText={setTitle} maxLength={200} placeholder="Title" />
      <TextField label="Note" value={body} onChangeText={setBody} multiline minHeight={220} placeholder="Write something…" />
      <AttachmentGallery attachments={note?.attachments ?? []} />

      <View style={styles.colors} accessibilityRole="radiogroup" accessibilityLabel="Note colour">
        <ColorDot
          label="No colour"
          selected={color === null}
          fill={Palette.glassHi}
          ring={Palette.lineStrong}
          onPress={() => setColor(null)}
        />
        {TONES.map((t) => (
          <ColorDot key={t} label={t} selected={color === t} fill={Tints[t].bg} ring={Tints[t].fg} onPress={() => setColor(t)} />
        ))}
      </View>

      {error ? <Banner kind="error">{error}</Banner> : null}
      <Button title={isNew ? "Add note" : "Save changes"} loading={create.isPending || update.isPending} disabled={busy} onPress={save} />
      {!isNew ? (
        <Button title="Delete note" kind="danger" icon="trash" loading={remove.isPending} disabled={busy} onPress={confirmDelete} />
      ) : null}
    </Screen>
  );
}

function ColorDot({
  label,
  selected,
  fill,
  ring,
  onPress,
}: {
  label: string;
  selected: boolean;
  fill: string;
  ring: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      hitSlop={6}
      onPress={onPress}
      style={[styles.dot, { backgroundColor: fill, borderColor: selected ? ring : Palette.line, borderWidth: selected ? 2 : 1 }]}
    />
  );
}

const styles = StyleSheet.create({
  page: { gap: 12, padding: 4 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  flex: { flex: 1 },
  bar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 36 },
  colors: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  dot: { width: 32, height: 32, borderRadius: Radius.pill },
});
