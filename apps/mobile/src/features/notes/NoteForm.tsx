import { safeName } from "@untitled/logic";
import type { Note, Tone } from "@untitled/types";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Share, StyleSheet, View } from "react-native";

import { useNoteActions } from "./queries";
import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Confirm";
import { EntryEditor } from "@/components/ui/EntryEditor";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { LoadingState } from "@/components/ui/States";
import { Palette, Radius, Space, Tints } from "@/constants/theme";
import { dbQuery } from "@/features/chat/db";
import { pickFiles, type PendingFile } from "@/features/chat/files";
import { putFile } from "@/features/journal/files";
import { errorMessage } from "@/lib/api";
import { timeOf } from "@/lib/dates";
import { NOTE_CATEGORIES } from "@/lib/preferences";
import { createUploadId } from "@/lib/uploadId";
import { useAppState } from "@/providers/AppState";

const TONES = Object.keys(Tints) as Tone[];
const TITLE_MAX = 200;
const BODY_MAX = 100_000;
type Version = { id: string; title: string; body: string; created_at: string };

/**
 * Writing or editing a note. It opens in the same writing page as journal entries (components/ui/EntryEditor), so a note feels like
 * an entry with a title: colour, category and pin sit under the title, and more actions (history, export, duplicate, delete) behind "more".
 */
export function NoteForm({ id, note, onSaved, onCancel }: { id: string; note?: Note; onSaved?: () => void; onCancel?: () => void }) {
  const { preferences, user } = useAppState();
  const isNew = id === "new";
  const { create, update, remove } = useNoteActions();
  const { ask, dialog } = useConfirm();
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [color, setColor] = useState<Tone | null>(note?.color ?? null);
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [categoryDraft, setCategoryDraft] = useState<string | null>(note?.category ?? null);
  const category = categoryDraft ?? preferences.defaultCategory;
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const close = () => (onCancel ? onCancel() : router.back());
  const changed =
    isNew ||
    title !== note?.title ||
    body !== note?.body ||
    color !== note?.color ||
    pinned !== note?.pinned ||
    category !== note?.category ||
    files.length > 0;
  const hasContent = title.trim().length > 0 || body.trim().length > 0 || files.length > 0;

  async function save() {
    if (!hasContent) return setError("Add a title or some text first.");
    setSaving(true);
    setError("");
    try {
      const values = { title: title.trim(), body, color, pinned, category };
      const saved = isNew ? (await create.mutateAsync(values)).data : (await update.mutateAsync({ id, ...values })).data;
      if (files.length && user) {
        const uploaded = await Promise.all(
          files.map((f) => putFile(`${user.id}/note/${saved.id}/${createUploadId()}-${safeName(f.name)}`, f)),
        );
        await update.mutateAsync({ id: saved.id, attachments: [...(note?.attachments ?? []), ...uploaded] });
      }
      if (onSaved) onSaved();
      else router.back();
    } catch (e) {
      setError(errorMessage(e, "Couldn’t save the note."));
    } finally {
      setSaving(false);
    }
  }

  async function attach(type?: string) {
    try {
      const { files: picked, tooBig } = await pickFiles(type);
      if (tooBig) setError("Files can be up to 10 MB.");
      setFiles((cur) => [...cur, ...picked]);
    } catch (e) {
      setError(errorMessage(e, "Couldn’t open your files."));
    }
  }

  async function openHistory() {
    if (!note) return;
    setMoreOpen(false);
    setHistoryOpen(true);
    setVersions(null);
    try {
      setVersions(
        (await dbQuery<Version[]>({
          table: "note_versions",
          op: "select",
          columns: "id,title,body,created_at",
          filters: [{ column: "note_id", op: "eq", value: note.id }],
          order: [{ column: "created_at", ascending: false }],
          limit: 30,
        })) ?? [],
      );
    } catch (e) {
      setError(errorMessage(e, "Couldn’t load version history."));
      setVersions([]);
    }
  }

  async function duplicate() {
    setMoreOpen(false);
    try {
      const copy = await create.mutateAsync({
        title: `${title || "Untitled note"} (copy)`.slice(0, TITLE_MAX),
        body,
        pinned: false,
        color,
        category,
      });
      router.replace({ pathname: "/note/[id]", params: { id: copy.data.id } });
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function deleteNote() {
    setMoreOpen(false);
    const yes = await ask({
      title: "Delete this note?",
      body: "The note and its attachments will be permanently deleted.",
      confirmLabel: "Delete note",
      danger: true,
    });
    if (yes) remove.mutate(id, { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) });
  }

  const options = (
    <>
      <View style={styles.chips}>
        <Chip icon="thumbtack" label={pinned ? "Pinned" : "Pin"} active={pinned} onPress={() => setPinned((v) => !v)} />
        <Chip icon="folder" label={category} onPress={() => setCategoryOpen(true)} />
        <View style={styles.colors} accessibilityRole="radiogroup" accessibilityLabel="Note colour">
          <ColorDot
            label="No colour"
            selected={color === null}
            fill={Palette.glassHi}
            ring={Palette.lineStrong}
            onPress={() => setColor(null)}
          />
          {TONES.map((tone) => (
            <ColorDot
              key={tone}
              label={tone}
              selected={color === tone}
              fill={Tints[tone].bg}
              ring={Tints[tone].fg}
              onPress={() => setColor(tone)}
            />
          ))}
        </View>
      </View>
      {note?.attachments.length ? <AttachmentGallery attachments={note.attachments} /> : null}
    </>
  );

  return (
    <EntryEditor
      embedded
      label={note ? `Editing · ${timeOf(note.updated_at)}` : "New note"}
      title={{ value: title, onChange: setTitle, placeholder: "Untitled note", maxLength: TITLE_MAX }}
      tone={color}
      inputLabel="Note body"
      placeholder="Write something…"
      maxLength={BODY_MAX}
      draft={body}
      onDraft={setBody}
      options={options}
      onMore={() => setMoreOpen(true)}
      files={files}
      onRemoveFile={(i) => setFiles((cur) => cur.filter((_, j) => j !== i))}
      onPickImages={() => void attach("image/*")}
      onPickFiles={() => void attach()}
      canSave={changed && hasContent && !saving}
      saving={saving}
      saveLabel={isNew ? "Add note" : "Save"}
      error={error}
      onSave={() => void save()}
      onClose={close}
    >
      <Sheet visible={categoryOpen} onClose={() => setCategoryOpen(false)} title="Note category">
        {NOTE_CATEGORIES.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: category === item }}
            onPress={() => {
              setCategoryDraft(item);
              setCategoryOpen(false);
            }}
            style={styles.row}
          >
            <AppText variant="body">{item}</AppText>
            {category === item ? <Icon name="check" size={15} color={Palette.greenFg} /> : null}
          </Pressable>
        ))}
      </Sheet>
      <Sheet visible={moreOpen} onClose={() => setMoreOpen(false)} title="Note actions">
        <Pressable
          accessibilityRole="button"
          style={styles.row}
          onPress={() => {
            setMoreOpen(false);
            void Share.share({ title: `${title || "note"}.md`, message: `# ${title || "Untitled note"}\n\n${body}` });
          }}
        >
          <AppText variant="body">Export as Markdown</AppText>
          <Icon name="download" size={15} color={Palette.fgMuted} />
        </Pressable>
        {!isNew ? (
          <>
            <Pressable accessibilityRole="button" style={styles.row} onPress={() => void duplicate()}>
              <AppText variant="body">Duplicate</AppText>
              <Icon name="clone" size={15} color={Palette.fgMuted} />
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.row} onPress={() => void openHistory()}>
              <AppText variant="body">Version history</AppText>
              <Icon name="clock-rotate-left" size={15} color={Palette.fgMuted} />
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.row} onPress={() => void deleteNote()}>
              <AppText variant="body" color={Palette.clayFg}>
                Delete note
              </AppText>
              <Icon name="trash" size={15} color={Palette.clayFg} />
            </Pressable>
          </>
        ) : null}
      </Sheet>
      <Sheet visible={historyOpen} onClose={() => setHistoryOpen(false)} title="Version history">
        {versions === null ? (
          <LoadingState />
        ) : versions.length ? (
          versions.map((v) => (
            <View key={v.id} style={styles.version}>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">
                  {new Date(v.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </AppText>
                <AppText variant="small" numberOfLines={1}>
                  {v.title || "Untitled note"}
                </AppText>
              </View>
              <Button
                title="Restore"
                kind="secondary"
                onPress={() => {
                  setTitle(v.title);
                  setBody(v.body);
                  setHistoryOpen(false);
                }}
              />
            </View>
          ))
        ) : (
          <AppText variant="small">No earlier versions yet. They’re saved as you edit.</AppText>
        )}
      </Sheet>
      {dialog}
    </EntryEditor>
  );
}

function Chip({ icon, label, active = false, onPress }: { icon: IconName; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active ? styles.chipOn : null]}
    >
      <Icon name={icon} size={13} color={active ? Palette.greenFg : Palette.fgMuted} />
      <AppText variant="small" color={active ? Palette.greenFg : Palette.fgMuted}>
        {label}
      </AppText>
    </Pressable>
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
  flex: { flex: 1 },
  // Plain wrapping rows (pin and category, then the colours): no scroll view to size, so nothing can collapse onto the label above.
  chips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: Space.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: Palette.glassHi,
    borderWidth: 1,
    borderColor: Palette.glassRing,
  },
  chipOn: { backgroundColor: Palette.surfaceAccent },
  colors: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: Space.sm },
  dot: { width: 28, height: 28, borderRadius: Radius.pill },
  row: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  version: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
});
