import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Attachment, JournalEntry } from "@untitled/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { useJournal, useJournalActions, useJournalDay } from "./queries";
import { MAX_UPLOAD_BYTES, uploadJournalFile } from "./files";
import { pickFiles, type PendingFile } from "@/features/chat/files";
import { useRecorder } from "@/features/chat/useRecorder";
import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { CalendarGrid } from "@/components/ui/DatePicker";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { Sheet } from "@/components/ui/Sheet";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { TextField } from "@/components/ui/TextField";
import { Palette, Radius } from "@/constants/theme";
import { useAppState } from "@/providers/AppState";
import { errorMessage } from "@/lib/api";
import { addDays, dayLabel, isoDate, timeOf } from "@/lib/dates";

const parseDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  return new Date(year, month - 1, day);
};

const draftKey = (userId: string, date: string) => `journal:draft:${userId}:${date}`;
const filesKey = (userId: string, date: string) => `journal:files:${userId}:${date}`;

function readPendingFiles(raw: string | null): PendingFile[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (file): file is PendingFile =>
        typeof file === "object" &&
        file !== null &&
        "uri" in file && typeof file.uri === "string" &&
        "name" in file && typeof file.name === "string" &&
        "type" in file && typeof file.type === "string" &&
        "size" in file && typeof file.size === "number",
    );
  } catch {
    return [];
  }
}

export function JournalScreen() {
  const { user } = useAppState();
  const allQ = useJournal();
  const [date, setDate] = useState(isoDate);
  const today = isoDate();
  const dayQ = useJournalDay(date);
  const { create, update, remove } = useJournalActions();
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [error, setError] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [draftLoadedFor, setDraftLoadedFor] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const rec = useRecorder((file) => setFiles((current) => [...current, file]), setError);
  const [pendingEntryId, setPendingEntryId] = useState<string | null>(null);
  const [pendingEntryDate, setPendingEntryDate] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ uri: string; attachment: Attachment }[]>([]);
  const activeDraftKey = user?.id ? draftKey(user.id, date) : "";
  const loadingDraft = !!activeDraftKey && draftLoadedFor !== activeDraftKey;

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      return;
    }
    void Promise.all([AsyncStorage.getItem(draftKey(user.id, date)), AsyncStorage.getItem(filesKey(user.id, date))])
      .then(([value, pendingFiles]) => {
        if (active) {
          setDraft(value ?? "");
          setFiles(readPendingFiles(pendingFiles));
          setDraftLoadedFor(draftKey(user.id, date));
          setError("");
        }
      })
      .catch(() => {
        if (active) {
          setDraft("");
          setFiles([]);
          setDraftLoadedFor(draftKey(user.id, date));
          setError("");
        }
      });
    return () => {
      active = false;
    };
  }, [date, user?.id]);

  useEffect(() => {
    if (!user?.id || loadingDraft || draftLoadedFor !== draftKey(user.id, date)) return;
    void AsyncStorage.multiSet([
      [draftKey(user.id, date), draft],
      [filesKey(user.id, date), JSON.stringify(files)],
    ]).catch(() => undefined);
  }, [date, draft, draftLoadedFor, files, loadingDraft, user?.id]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([allQ.refetch(), dayQ.refetch()]);
    setRefreshing(false);
  }, [allQ, dayQ]);

  const entries = dayQ.data ?? [];
  const markedDays = useMemo(() => new Set((allQ.data ?? []).map((entry) => entry.entry_date)), [allQ.data]);
  const selectedDate = parseDate(date);
  const title = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(selectedDate.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
  const compactTitle = selectedDate.toLocaleDateString(undefined, { day: "numeric", month: "long" });
  const weekday = selectedDate.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
  const canAdd = (draft.trim().length > 0 || files.length > 0) && !busy && !loadingDraft && !rec.recording;

  async function attach() {
    try {
      const result = await pickFiles();
      if (result.tooBig) setError("Files can be up to 10 MB.");
      if (result.files.length) setFiles((current) => [...current, ...result.files]);
    } catch {
      setError("Couldn’t open your files.");
    }
  }

  async function addEntry() {
    const body = draft.trim();
    if (!canAdd || !user) return;
    setBusy(true);
    setError("");
    try {
      let entryId = pendingEntryDate === date ? pendingEntryId : null;
      if (!entryId) {
        const voiceOnly = !body && files.every((file) => file.type.startsWith("audio/"));
        const created = await create.mutateAsync({ entry_date: date, body, kind: voiceOnly ? "voice" : "text" });
        entryId = created.data.id;
        setPendingEntryId(entryId);
        setPendingEntryDate(date);
      }
      const failedFiles: PendingFile[] = [];
      const uploaded = [...(pendingEntryDate === date ? uploadedFiles : [])];
      for (const file of files) {
        if (uploaded.some((item) => item.uri === file.uri)) continue;
        if (file.size > MAX_UPLOAD_BYTES) {
          setError("Files can be up to 10 MB.");
          failedFiles.push(file);
          continue;
        }
        try {
          uploaded.push({ uri: file.uri, attachment: await uploadJournalFile(user.id, entryId, file) });
        } catch (e) {
          setError(errorMessage(e, `Couldn’t upload ${file.name}.`));
          failedFiles.push(file);
        }
      }
      if (uploaded.length) {
        try {
          await update.mutateAsync({ id: entryId, attachments: uploaded.map((item) => item.attachment) });
        } catch {
          for (const file of files) {
            if (!failedFiles.some((failed) => failed.uri === file.uri)) failedFiles.push(file);
          }
          setError("The entry was saved, but its attachments couldn’t be linked. Try adding them again.");
        }
      }
      setUploadedFiles(uploaded);
      setDraft("");
      setFiles(failedFiles);
      if (!failedFiles.length) {
        setPendingEntryId(null);
        setPendingEntryDate(null);
        setUploadedFiles([]);
        setNewEntryOpen(false);
      }
    } catch (e) {
      setError(errorMessage(e, "Couldn’t save that entry."));
    } finally {
      setBusy(false);
    }
  }

  function removeEntry(entry: JournalEntry) {
    Alert.alert("Delete this entry?", `The entry from ${timeOf(entry.created_at)} and its attachments will be permanently deleted.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => remove.mutate(entry.id, { onError: (e) => Alert.alert("Couldn’t delete", errorMessage(e)) }),
      },
    ]);
  }

  function saveEdit(entry: JournalEntry) {
    update.mutate(
      { id: entry.id, body: editDraft },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditDraft("");
        },
        onError: (e) => setError(errorMessage(e, "Couldn’t save that change.")),
      },
    );
  }

  return (
    <Screen onRefresh={() => void refresh()} refreshing={refreshing}>
      <Card tone="sand" style={styles.dateCard}>
        <View style={styles.dateNav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous day"
            onPress={() => { setEditingId(null); setDate((current) => addDays(current, -1)); }}
            style={styles.navButton}
          >
            <Icon name="chevron-left" size={18} color={Palette.fgMuted} />
          </Pressable>
          <View style={styles.flex} />
          <Pressable accessibilityRole="button" accessibilityLabel="Open journal calendar" onPress={() => setCalendarOpen(true)} style={styles.navButton}>
            <Icon name="calendar-days" size={17} color={Palette.fgMuted} />
          </Pressable>
          <View style={styles.flex} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next day"
            accessibilityState={{ disabled: date >= today }}
            disabled={date >= today}
            onPress={() => { setEditingId(null); setDate((current) => addDays(current, 1)); }}
            style={[styles.navButton, date >= today ? styles.disabled : null]}
          >
            <Icon name="chevron-right" size={18} color={Palette.fgMuted} />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${weekday}, ${compactTitle}, ${entries.length} entries. Choose date.`}
          onPress={() => setCalendarOpen(true)}
          style={styles.selectedDate}
        >
          <View style={styles.selectedDateLabel}>
            <AppText variant="label" color={Palette.greenFg}>{weekday}</AppText>
            <AppText variant="bodyStrong" style={styles.selectedDateText}>{compactTitle}</AppText>
          </View>
          <AppText variant="body" color={Palette.fgSubtle}>{dayQ.isPending ? "" : entries.length}</AppText>
        </Pressable>
      </Card>
      <Button title="New entry" icon="plus" onPress={() => setNewEntryOpen(true)} style={styles.newEntryButton} />

      <Card tone="violet" style={styles.dayCard}>
        <View style={styles.dayTitleBlock}>
          <View style={styles.titleRow}>
            <AppText variant="title" style={styles.dayTitle} accessibilityRole="header">{title}</AppText>
            {date === today ? (
              <View style={styles.todayPill}>
                <AppText variant="label" color={Palette.onDark}>Today</AppText>
              </View>
            ) : null}
          </View>
          <AppText variant="body" color={Palette.fgSubtle}>
            {dayQ.isPending ? " " : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
          </AppText>
        </View>

        {dayQ.isPending ? <LoadingState label="Loading entries…" /> : dayQ.isError ? (
          <ErrorState message={errorMessage(dayQ.error)} onRetry={() => void dayQ.refetch()} />
        ) : entries.length ? (
          <View style={styles.entries}>
            {entries.map((entry) => (
                <Card
                  key={entry.id}
                  accessibilityLabel={`Open journal entry at ${timeOf(entry.created_at)}`}
                  onPress={editingId === entry.id ? undefined : () => setViewingEntry(entry)}
                  style={styles.entryCard}
                >
                  <View style={styles.entryMeta}>
                    <AppText variant="small" color={Palette.fgSubtle}>{timeOf(entry.created_at)}</AppText>
                    <View style={styles.entryActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={editingId === entry.id ? "Cancel editing entry" : "Edit entry"}
                        onPress={() => {
                          setError("");
                          setEditingId(editingId === entry.id ? null : entry.id);
                          setEditDraft(editingId === entry.id ? "" : entry.body);
                        }}
                        style={styles.entryAction}
                      >
                        <Icon name={editingId === entry.id ? "xmark" : "pen"} size={17} color={Palette.fgSubtle} />
                      </Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel="Delete entry" onPress={() => removeEntry(entry)} style={styles.entryAction}>
                        <Icon name="trash-can" size={17} color={Palette.fgSubtle} />
                      </Pressable>
                    </View>
                  </View>
                  {editingId === entry.id ? (
                    <View style={styles.editForm}>
                      <TextField label="Edit entry" value={editDraft} onChangeText={setEditDraft} multiline minHeight={120} maxLength={50_000} />
                      <View style={styles.editActions}>
                        <Button title="Cancel" kind="secondary" onPress={() => { setEditingId(null); setEditDraft(""); }} />
                        <Button title="Save" loading={update.isPending} onPress={() => saveEdit(entry)} />
                      </View>
                    </View>
                  ) : entry.body ? <Markdown text={entry.body} /> : null}
                  <AttachmentGallery attachments={entry.attachments} />
                </Card>
            ))}
          </View>
        ) : (
          <AppText variant="small" color={Palette.fgSubtle} style={styles.emptyLine}>
            {date === today ? "Nothing written yet today. What’s on your mind?" : "No entries on this day."}
          </AppText>
        )}
      </Card>

      {!allQ.isPending && !allQ.isError && allQ.data?.length === 0 ? (
        <EmptyState icon="book-open" title="Your journal is ready" hint="Write a line above. One sentence is enough." />
      ) : null}

      <Sheet visible={newEntryOpen} onClose={() => setNewEntryOpen(false)} title="New entry">
      <Card tone="amber" style={styles.composer}>
        <AppText variant="label">New entry</AppText>
        <TextField
          label={`Your thoughts · ${dayLabel(date, today)}`}
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={50_000}
          minHeight={110}
          placeholder="Start writing…"
          editable={!loadingDraft && !busy}
        />
        {rec.recording ? <AppText variant="small" color={Palette.rec}>Stop recording to attach the audio.</AppText> : null}
        {files.length ? (
          <View style={styles.pendingFiles}>
            {files.map((file, index) => (
              <View key={`${file.uri}-${index}`} style={styles.fileChip}>
                <Icon name={file.type.startsWith("audio/") ? "microphone" : file.type.startsWith("image/") ? "image" : "paperclip"} size={13} color={Palette.greenFg} />
                <AppText variant="small" numberOfLines={1} style={styles.fileName}>{file.name}</AppText>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${file.name}`} onPress={() => setFiles((current) => current.filter((_, i) => i !== index))} hitSlop={8}>
                  <Icon name="xmark" size={13} color={Palette.fgSubtle} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.composerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Attach files" onPress={() => void attach()} style={styles.toolButton}>
            <Icon name="paperclip" size={17} color={Palette.fgMuted} />
            <AppText variant="small">Attach</AppText>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={rec.recording ? "Stop recording" : "Record a voice note"} onPress={() => void rec.toggle()} style={[styles.toolButton, rec.recording ? styles.recording : null]}>
            <Icon name={rec.recording ? "stop" : "microphone"} size={16} color={rec.recording ? Palette.rec : Palette.fgMuted} />
            <AppText variant="small" color={rec.recording ? Palette.rec : Palette.fgMuted}>
              {rec.recording ? `${Math.floor(rec.secs / 60)}:${String(rec.secs % 60).padStart(2, "0")}` : "Voice"}
            </AppText>
          </Pressable>
          <View style={styles.flex} />
          <Button title="Add entry" icon="arrow-up" loading={busy} disabled={!canAdd} onPress={() => void addEntry()} style={styles.addButton} />
        </View>
        {error ? <Banner kind="error">{error}</Banner> : null}
      </Card>
      </Sheet>

      <Sheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} title="Choose a day">
        <CalendarGrid
          value={date}
          onPick={(picked) => {
            setDate(picked);
            setCalendarOpen(false);
          }}
          marks={markedDays}
          maxDate={today}
        />
        <Button title="Today" kind="secondary" icon="calendar-day" onPress={() => { setDate(today); setCalendarOpen(false); }} style={styles.todayButton} />
      </Sheet>

      <Sheet
        visible={viewingEntry !== null}
        onClose={() => setViewingEntry(null)}
        title={viewingEntry ? `${dayLabel(viewingEntry.entry_date)} · ${timeOf(viewingEntry.created_at)}` : undefined}
      >
        {viewingEntry ? (
          <View style={styles.entryDetail}>
            <Card tone="violet" style={styles.entryDetailCard}>
              {viewingEntry.body ? <Markdown text={viewingEntry.body} /> : null}
              <AttachmentGallery attachments={viewingEntry.attachments} />
            </Card>
            <Button
              title="Edit entry"
              icon="pen"
              onPress={() => {
                setEditingId(viewingEntry.id);
                setEditDraft(viewingEntry.body);
                setViewingEntry(null);
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dateCard: { gap: 12, padding: 14, borderRadius: Radius.r4 },
  dateNav: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
  navButton: { width: 42, height: 42, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.35 },
  selectedDate: { minHeight: 76, borderRadius: Radius.r3, borderWidth: 2, borderColor: Palette.greenFg, backgroundColor: Palette.greenBg, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectedDateLabel: { gap: 4 },
  selectedDateText: { fontSize: 19, lineHeight: 24 },
  newEntryButton: { alignSelf: "stretch" },
  dayCard: { gap: 0, padding: 0, borderRadius: Radius.r4, overflow: "hidden" },
  dayTitleBlock: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: Palette.line },
  titleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 },
  dayTitle: { flexShrink: 1 },
  todayPill: { minHeight: 34, paddingHorizontal: 16, borderRadius: Radius.pill, backgroundColor: Palette.fillDark, alignItems: "center", justifyContent: "center" },
  entries: { gap: 12, padding: 14 },
  entryCard: { gap: 14, padding: 18, borderRadius: Radius.r3 },
  entryDetail: { gap: 12 },
  entryDetailCard: { gap: 12 },
  entryMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  entryActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  entryAction: { width: 36, height: 36, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
  editForm: { gap: 12 },
  editActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  emptyLine: { paddingVertical: 8 },
  composer: { gap: 12 },
  pendingFiles: { gap: 8 },
  fileChip: { minHeight: 38, borderRadius: Radius.pill, backgroundColor: Palette.greenBg, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  fileName: { flex: 1 },
  composerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  toolButton: { minHeight: 42, paddingHorizontal: 10, borderRadius: Radius.pill, flexDirection: "row", alignItems: "center", gap: 7 },
  recording: { backgroundColor: Palette.clayBg },
  addButton: { minHeight: 44, paddingHorizontal: 16 },
  todayButton: { marginTop: 12 },
});
