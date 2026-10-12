import type { Note, Tone } from "@untitled/types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Share, StyleSheet, TextInput, View } from "react-native";

import { useNote, useNoteActions } from "./queries";
import { dbQuery } from "@/features/chat/db";
import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Banner } from "@/components/ui/Banner";
import { BarButton, DetailBar } from "@/components/ui/DetailBar";
import { Markdown } from "@/components/ui/Markdown";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { TextField } from "@/components/ui/TextField";
import { Sheet } from "@/components/ui/Sheet";
import { Font, Palette, Radius, Tints } from "@/constants/theme";
import { errorMessage } from "@/lib/api";
import { timeOf } from "@/lib/dates";
import { NOTE_CATEGORIES } from "@/lib/preferences";
import { useAppState } from "@/providers/AppState";
import { useSignedUrls } from "@/features/attachments/useSignedUrls";
import * as DocumentPicker from "expo-document-picker";
import { mobileEnv } from "@/config/env";
import { authClient } from "@/lib/auth-client";
import { createUploadId } from "@/lib/uploadId";

type Selection = { start: number; end: number };
type NoteVersion = { id: string; title: string; body: string; created_at: string };
type SlashCommand = { label: string; insert: string };
const COMMANDS: SlashCommand[] = [
  { label: "Heading 1", insert: "# " }, { label: "Heading 2", insert: "## " },
  { label: "Bullet list", insert: "- " }, { label: "Checklist", insert: "- [ ] " },
  { label: "Quote", insert: "> " }, { label: "Code block", insert: "```\n\n```" },
  { label: "Divider", insert: "---\n" },
  { label: "Today’s date", insert: new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
];

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
        <View style={styles.editorTitleRow}>
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
  const { preferences, user } = useAppState();
  const isNew = id === "new";
  const { create, update, remove } = useNoteActions();
  const bodyInput = useRef<TextInput>(null);
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const bodyRef = useRef(body);
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 });
  const [preview, setPreview] = useState(false);
  const [find, setFind] = useState<string | null>(null);
  const [findQuery, setFindQuery] = useState("");
  const [slash, setSlash] = useState<{ start: number; query: string } | null>(null);
  const [versions, setVersions] = useState<NoteVersion[] | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [attachments, setAttachments] = useState(note?.attachments ?? []);
  const [color, setColor] = useState<Tone | null>(note?.color ?? null);
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [categoryDraft, setCategoryDraft] = useState<string | null>(note?.category ?? null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const category = categoryDraft ?? preferences.defaultCategory;
  const [error, setError] = useState("");
  const signedUrls = useSignedUrls(attachments);

  const updateNote = update.mutate;
  useEffect(() => {
    if (!note || (title === note.title && body === note.body && color === note.color && pinned === note.pinned && category === note.category)) return;
    const timer = setTimeout(() => updateNote({ id: note.id, title: title.trim(), body, color, pinned, category }), 900);
    return () => clearTimeout(timer);
  }, [note, title, body, color, pinned, category, updateNote]);

  const busy = create.isPending || update.isPending || remove.isPending;

  function save() {
    setError("");
    const values = { title: title.trim(), body, color, pinned, category };
    if (!values.title && !values.body.trim()) return setError("Add a title or some text first.");
    const done = {
      onSuccess: () => (onSaved ? onSaved() : router.back()),
      onError: (e: unknown) => setError(errorMessage(e, "Couldn’t save the note.")),
    };
    if (isNew) create.mutate(values, done);
    else update.mutate({ id, ...values }, done);
  }

  function confirmDelete() {
    setDeleteConfirmOpen(true);
  }

  function setBodyValue(value: string, nextSelection?: Selection) {
    if (value !== bodyRef.current) {
      undoStack.current = [...undoStack.current.slice(-49), bodyRef.current];
      redoStack.current = [];
      setCanUndo(true);
      setCanRedo(false);
    }
    bodyRef.current = value;
    setBody(value);
    if (nextSelection) setSelection(nextSelection);
  }

  function replaceSelection(insert: string, wrap = "") {
    const start = selection.start;
    const end = selection.end;
    const selected = body.slice(start, end);
    const value = `${body.slice(0, start)}${wrap}${insert || selected}${wrap}${body.slice(end)}`;
    const cursor = start + wrap.length + (insert || selected).length;
    setBodyValue(value, { start: cursor, end: cursor });
    requestAnimationFrame(() => bodyInput.current?.focus());
  }

  function prefixLine(prefix: string) {
    const start = body.lastIndexOf("\n", Math.max(0, selection.start - 1)) + 1;
    const already = body.startsWith(prefix, start);
    const value = already ? `${body.slice(0, start)}${body.slice(start + prefix.length)}` : `${body.slice(0, start)}${prefix}${body.slice(start)}`;
    const offset = already ? -prefix.length : prefix.length;
    setBodyValue(value, { start: selection.start + offset, end: selection.end + offset });
    requestAnimationFrame(() => bodyInput.current?.focus());
  }

  function historyStep(direction: "undo" | "redo") {
    const from = direction === "undo" ? undoStack.current : redoStack.current;
    const to = direction === "undo" ? redoStack.current : undoStack.current;
    const value = from.pop();
    if (value === undefined) return;
    to.push(bodyRef.current);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
    bodyRef.current = value;
    setBody(value);
  }

  function handleBodyChange(value: string) {
    const previous = bodyRef.current;
    const cursor = selection.start + (value.length - previous.length);
    setBodyValue(value, { start: Math.max(0, cursor), end: Math.max(0, cursor) });
    const before = value.slice(0, Math.max(0, cursor));
    const match = /(^|\s)\/(\w*)$/.exec(before);
    setSlash(match ? { start: cursor - match[2].length - 1, query: match[2].toLowerCase() } : null);
  }

  function chooseCommand(command: SlashCommand) {
    const start = slash?.start ?? selection.start;
    const end = selection.start;
    const cursor = start + command.insert.length;
    const value = `${body.slice(0, start)}${command.insert}${body.slice(end)}`;
    setBodyValue(value, { start: cursor, end: cursor });
    setSlash(null);
    requestAnimationFrame(() => bodyInput.current?.focus());
  }

  async function openHistory() {
    if (!note) return;
    setHistoryOpen(true);
    setVersions(null);
    try {
      setVersions(await dbQuery<NoteVersion[]>({ table: "note_versions", op: "select", columns: "id,title,body,created_at", filters: [{ column: "note_id", op: "eq", value: note.id }], order: [{ column: "created_at", ascending: false }], limit: 30 }) ?? []);
    } catch (e) {
      setError(errorMessage(e, "Couldn’t load version history."));
      setVersions([]);
    }
  }

  function restoreVersion(version: NoteVersion) {
    setTitle(version.title);
    setBodyValue(version.body);
    setHistoryOpen(false);
  }

  async function attachFile() {
    if (!note || !user) return setError("Save the note before adding an attachment.");
    const picked = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true, type: "*/*" });
    if (picked.canceled || !picked.assets[0]) return;
    const file = picked.assets[0];
    if ((file.size ?? 0) > 10 * 1024 * 1024) return setError("Attachments can be up to 10 MB.");
    const path = `${user.id}/note/${note.id}/${createUploadId()}-${file.name.replace(/[^\w. -]/g, "_")}`;
    const cookie = await authClient?.getCookie();
    const response = await fetch(`${mobileEnv.apiBaseUrl}/api/v1/storage/o/note-files/${path.split("/").map(encodeURIComponent).join("/")}`, {
      method: "PUT", headers: { "content-type": file.mimeType || "application/octet-stream", ...(cookie ? { Cookie: cookie } : {}) }, credentials: "omit", body: await (await fetch(file.uri)).blob(),
    });
    if (!response.ok) return setError("Couldn’t upload that attachment.");
    const next = [...attachments, { path, name: file.name, type: file.mimeType || "application/octet-stream", size: file.size ?? 0 }];
    setAttachments(next);
    await update.mutateAsync({ id: note.id, attachments: next });
  }

  async function duplicateNote() {
    const result = await create.mutateAsync({ title: `${title || "Untitled Note"} (copy)`.slice(0, 200), body, pinned: false, color, category });
    const duplicateId = result.data.id;
    router.replace({ pathname: "/note/[id]", params: { id: duplicateId } });
  }

  const wordCount = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = (text: string) => text ? text.split("\n").length : 0;
  const matches = findQuery ? body.toLowerCase().split(findQuery.toLowerCase()).length - 1 : 0;
  const commands = COMMANDS.filter((command) => !slash || command.label.toLowerCase().includes(slash.query) || command.insert.includes(slash.query));

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <View style={[styles.editorHead, { backgroundColor: color ? Tints[color].bg : Tints.amber.bg, borderColor: color ? Tints[color].line : Tints.amber.line }]}>
        <View style={styles.titleRow}>
          <TextInput
            accessibilityLabel="Note title"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            placeholder="Untitled Note"
            placeholderTextColor={Palette.fgSubtle}
            selectionColor={Palette.greenFg}
            returnKeyType="next"
            style={styles.titleInput}
          />
          <View style={styles.titleActions}>
            <Pressable accessibilityRole="button" accessibilityLabel={pinned ? "Unpin note" : "Pin note"} accessibilityState={{ selected: pinned }} hitSlop={8} onPress={() => setPinned((value) => !value)} style={styles.headAction}>
              <Icon name="thumbtack" size={17} color={pinned ? Palette.greenFg : Palette.fgMuted} />
            </Pressable>
            {!isNew ? <Pressable accessibilityRole="button" accessibilityLabel="Delete note" hitSlop={8} onPress={confirmDelete} style={styles.headAction}><Icon name="trash" size={17} color={Palette.clayFg} /></Pressable> : null}
            <Pressable accessibilityRole="button" accessibilityLabel="Close editor" hitSlop={8} onPress={() => (onCancel ? onCancel() : router.back())} style={styles.headAction}><Icon name="xmark" size={18} color={Palette.fgMuted} /></Pressable>
          </View>
        </View>
        <View style={styles.stats}>
          <StatChip>{wordCount(body)} {wordCount(body) === 1 ? "word" : "words"}</StatChip>
          <StatChip>{lineCount(body)} {lineCount(body) === 1 ? "line" : "lines"}</StatChip>
          <AppText variant="small" color={Palette.fgSubtle}>{update.isPending ? "Saving…" : note ? `Edited ${timeOf(note.updated_at)}` : "New note"}</AppText>
        </View>
      </View>

      <View style={styles.toolbar} accessibilityRole="toolbar" accessibilityLabel="Note formatting">
        <Tool label={preview ? "Edit note" : "Preview note"} icon={preview ? "pen" : "eye"} onPress={() => { setPreview((value) => !value); setSlash(null); }} active={preview} />
        <Tool label="Bold" icon="bold" onPress={() => replaceSelection(body.slice(selection.start, selection.end), "**")} />
        <Tool label="Quote" icon="quote-left" onPress={() => prefixLine("> ")} />
        <Tool label="Heading" icon="heading" onPress={() => prefixLine("# ")} />
        <Tool label="Bullet list" icon="list-ul" onPress={() => prefixLine("- ")} />
        <Tool label="Inline code" icon="code" onPress={() => replaceSelection(body.slice(selection.start, selection.end), "`")} />
        <Tool label="Undo" icon="rotate-left" onPress={() => historyStep("undo")} disabled={!canUndo} />
        <Tool label="Redo" icon="rotate-right" onPress={() => historyStep("redo")} disabled={!canRedo} />
        <Tool label="AI actions" icon="wand-magic-sparkles" onPress={() => undefined} disabled />
        <Tool label="Add link" icon="link" onPress={() => { setLinkUrl(""); setLinkOpen(true); }} />
        <Tool label="Dictate" icon="microphone" onPress={() => undefined} disabled />
        <Tool label="Code block" icon="terminal" onPress={() => replaceSelection(`${body.slice(selection.start, selection.end)}\n`, "```\n")} />
        <Tool label={find === null ? "Find in note" : "Close find"} icon="magnifying-glass" onPress={() => { setFind(find === null ? "" : null); setFindQuery(""); }} active={find !== null} />
        {!isNew ? <Tool label="Version history" icon="clock-rotate-left" onPress={() => void openHistory()} active={historyOpen} /> : null}
        <Tool label="More note actions" icon="ellipsis-vertical" onPress={() => setMoreOpen(true)} />
      </View>

      {find !== null ? <View style={styles.findRow}>
        <TextField label="Find in note" value={findQuery} onChangeText={setFindQuery} placeholder="Find in note…" />
        <AppText variant="small" color={Palette.fgSubtle}>{findQuery ? `${matches} found` : ""}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Next match" onPress={() => {
          const index = body.toLowerCase().indexOf(findQuery.toLowerCase(), selection.end);
          const next = index < 0 ? body.toLowerCase().indexOf(findQuery.toLowerCase()) : index;
          if (next >= 0) setSelection({ start: next, end: next + findQuery.length });
        }} style={styles.headAction}><Icon name="chevron-down" size={14} color={Palette.fgMuted} /></Pressable>
      </View> : null}

      {preview ? (
        <View style={[styles.preview, { backgroundColor: color ? Tints[color].bg : Tints.amber.bg }]}>
          <Markdown text={body} />
        </View>
      ) : (
        <View style={[styles.bodyWrap, { backgroundColor: color ? Tints[color].bg : Tints.amber.bg, borderColor: color ? Tints[color].line : Tints.amber.line }]}>
          <TextInput
            ref={bodyInput}
            accessibilityLabel="Note body"
            value={body}
            onChangeText={handleBodyChange}
            onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
            selection={selection}
            multiline
            textAlignVertical="top"
            placeholder="Write something, or type / for commands…"
            placeholderTextColor={Palette.fgSubtle}
            selectionColor={Palette.greenFg}
            maxLength={100000}
            autoCapitalize="sentences"
            style={styles.bodyInput}
          />
        </View>
      )}

      {attachments.length ? <AttachmentGallery attachments={attachments} /> : null}
      {note?.attachments.length && signedUrls.isError ? <AppText variant="small" color={Palette.clayFg}>Some attachments couldn’t be loaded.</AppText> : null}
      <Sheet visible={categoryOpen} onClose={() => setCategoryOpen(false)} title="Note category">
        {NOTE_CATEGORIES.map((item) => (
          <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: category === item }} onPress={() => { setCategoryDraft(item); setCategoryOpen(false); }} style={styles.categoryOption}>
            <AppText variant="body">{item}</AppText>{category === item ? <Icon name="check" size={15} color={Palette.greenFg} /> : null}
          </Pressable>
        ))}
      </Sheet>

      <Sheet visible={slash !== null && !preview} onClose={() => setSlash(null)} title="Commands">
        {commands.map((command) => <Pressable key={command.label} accessibilityRole="button" onPress={() => chooseCommand(command)} style={styles.categoryOption}><AppText variant="body">{command.label}</AppText><Icon name="chevron-right" size={14} color={Palette.fgFaint} /></Pressable>)}
      </Sheet>
      <Sheet visible={moreOpen} onClose={() => setMoreOpen(false)} title="Note actions">
        <AppText variant="label">Colour</AppText>
        <View style={styles.colors} accessibilityRole="radiogroup" accessibilityLabel="Note colour">
          <ColorDot label="No colour" selected={color === null} fill={Palette.glassHi} ring={Palette.lineStrong} onPress={() => setColor(null)} />
          {TONES.map((tone) => <ColorDot key={tone} label={tone} selected={color === tone} fill={Tints[tone].bg} ring={Tints[tone].fg} onPress={() => setColor(tone)} />)}
        </View>
        <Pressable accessibilityRole="button" onPress={() => { setMoreOpen(false); setCategoryOpen(true); }} style={styles.categoryOption}><AppText variant="body">Category · {category}</AppText><Icon name="chevron-right" size={14} color={Palette.fgFaint} /></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { setMoreOpen(false); void attachFile(); }} style={styles.categoryOption}><AppText variant="body">Attach a file</AppText><Icon name="paperclip" size={15} color={Palette.fgMuted} /></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { setMoreOpen(false); void Share.share({ title: `${title || "note"}.md`, message: `# ${title || "Untitled Note"}\n\n${body}` }); }} style={styles.categoryOption}><AppText variant="body">Export as Markdown</AppText><Icon name="download" size={15} color={Palette.fgMuted} /></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { setMoreOpen(false); void duplicateNote().catch((e: unknown) => setError(errorMessage(e))); }} style={styles.categoryOption}><AppText variant="body">Duplicate</AppText><Icon name="clone" size={15} color={Palette.fgMuted} /></Pressable>
      </Sheet>
      <Sheet visible={historyOpen} onClose={() => setHistoryOpen(false)} title="Version history">
        {versions === null ? <LoadingState /> : versions.length ? versions.map((version) => <View key={version.id} style={styles.versionRow}>
          <View style={styles.flex}><AppText variant="bodyStrong">{new Date(version.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</AppText><AppText variant="small" color={Palette.fgSubtle} numberOfLines={2}>{(version.title || version.body).slice(0, 70) || "Empty"}</AppText></View>
          <Button title="Restore" kind="secondary" onPress={() => restoreVersion(version)} />
        </View>) : <AppText variant="small" color={Palette.fgSubtle}>No earlier versions yet. They’re saved as you edit.</AppText>}
      </Sheet>
      <Sheet visible={linkOpen} onClose={() => setLinkOpen(false)} title="Add a link">
        <TextField label="Link address" value={linkUrl} onChangeText={setLinkUrl} placeholder="https://example.com" autoCapitalize="none" keyboardType="url" />
        <Button title="Add link" disabled={!/^https?:\/\/\S+\.\S+/i.test(linkUrl)} onPress={() => { replaceSelection(`[${body.slice(selection.start, selection.end) || "link"}](${linkUrl})`); setLinkOpen(false); }} />
      </Sheet>
      <Sheet visible={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete this note?">
        <AppText variant="body" color={Palette.fgMuted}>This can’t be undone.</AppText>
        <Button title="Delete note" kind="danger" loading={remove.isPending} onPress={() => remove.mutate(id, { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) })} />
        <Button title="Cancel" kind="secondary" onPress={() => setDeleteConfirmOpen(false)} />
      </Sheet>

      {error ? <Banner kind="error">{error}</Banner> : null}
      {isNew ? <Button title="Add note" loading={create.isPending} disabled={busy} onPress={save} /> : <AppText variant="small" color={Palette.fgSubtle}>Changes save automatically.</AppText>}
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
  colors: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  dot: { width: 32, height: 32, borderRadius: Radius.pill },
  categoryOption: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  editorHead: { width: "100%", gap: 12, padding: 16, borderRadius: Radius.r3, backgroundColor: Tints.amber.bg, borderWidth: 1, borderColor: Tints.amber.line },
  editorTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  titleInput: { flex: 1, minWidth: 0, paddingVertical: 4, color: Palette.fg, ...Font.serif, fontSize: 30, lineHeight: 36 },
  titleActions: { flexDirection: "row", alignItems: "center", gap: 2 },
  stats: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  stat: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Palette.glassHi },
  headAction: { width: 38, height: 38, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: Palette.glassHi },
  toolbar: { width: "100%", flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 6, paddingHorizontal: 2, paddingVertical: 2 },
  tool: { width: 40, height: 40, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: Palette.glassHi },
  toolActive: { backgroundColor: Palette.surfaceAccent },
  toolDisabled: { opacity: 0.4 },
  findRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bodyWrap: { width: "100%", minHeight: 340, padding: 18, borderRadius: Radius.r3, backgroundColor: Tints.amber.bg, borderWidth: 1, borderColor: Tints.amber.line },
  bodyInput: { width: "100%", minHeight: 300, padding: 16, borderRadius: Radius.r2, backgroundColor: Palette.glassHi, color: Palette.fg, ...Font.sans, fontSize: 17, lineHeight: 25 },
  preview: { width: "100%", minHeight: 340, padding: 20, borderRadius: Radius.r3, backgroundColor: Palette.glassHi },
  versionRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
});

function StatChip({ children }: { children: React.ReactNode }) {
  return <View style={styles.stat}><AppText variant="small" color={Palette.fgMuted}>{children}</AppText></View>;
}

function Tool({ label, icon, onPress, active = false, disabled = false }: { label: string; icon: IconName; onPress: () => void; active?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active, disabled }} disabled={disabled} onPress={onPress} style={[styles.tool, active ? styles.toolActive : null, disabled ? styles.toolDisabled : null]}><Icon name={icon} size={17} color={active ? Palette.greenFg : Palette.fgMuted} /></Pressable>;
}
