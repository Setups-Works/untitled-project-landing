import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Attachment, JournalEntry } from "@untitled/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { useJournal, useJournalActions, useJournalDay } from "./queries";
import { EntryEditor } from "./EntryEditor";
import { MAX_UPLOAD_BYTES, uploadJournalFile } from "./files";
import { pickFiles, type PendingFile } from "@/features/chat/files";
import { useRecorder } from "@/features/chat/useRecorder";
import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Button } from "@/components/ui/Button";
import { CalendarGrid } from "@/components/ui/DatePicker";
import { Card } from "@/components/ui/Card";
import { useConfirm } from "@/components/ui/Confirm";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { Sheet } from "@/components/ui/Sheet";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
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
  const { ask, dialog } = useConfirm();
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
  const editingEntry = entries.find((entry) => entry.id === editingId);
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

  async function attach(type?: string) {
    try {
      const result = await pickFiles(type);
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

  async function removeEntry(entry: JournalEntry) {
    const ok = await ask({
      title: "Delete this entry?",
      body: `The entry from ${timeOf(entry.created_at)} and its attachments will be permanently deleted.`,
      confirmLabel: "Delete entry",
      danger: true,
    });
    if (!ok) return;
    remove.mutate(entry.id, {
      onError: (e) => setError(errorMessage(e, "Couldn’t delete that entry.")),
    });
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
                  onPress={() => setViewingEntry(entry)}
                  style={styles.entryCard}
                >
                  <View style={styles.entryMeta}>
                    <AppText variant="small" color={Palette.fgSubtle}>{timeOf(entry.created_at)}</AppText>
                    <View style={styles.entryActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Edit entry"
                        onPress={() => {
                          setError("");
                          setEditingId(entry.id);
                          setEditDraft(entry.body);
                        }}
                        style={styles.entryAction}
                      >
                        <Icon name="pen" size={17} color={Palette.fgSubtle} />
                      </Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel="Delete entry" onPress={() => removeEntry(entry)} style={styles.entryAction}>
                        <Icon name="trash-can" size={17} color={Palette.fgSubtle} />
                      </Pressable>
                    </View>
                  </View>
                  {entry.body ? <Markdown text={entry.body} /> : null}
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

      <EntryEditor
        visible={newEntryOpen}
        dayLabel={`${dayLabel(date, today)} · ${selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`}
        draft={draft}
        onDraft={setDraft}
        files={files}
        onRemoveFile={(index) => setFiles((current) => current.filter((_, i) => i !== index))}
        recording={rec.recording}
        recordingSecs={rec.secs}
        onToggleRecording={() => void rec.toggle()}
        onPickImages={() => void attach("image/*")}
        onPickFiles={() => void attach()}
        canSave={canAdd}
        saving={busy}
        error={error}
        onSave={() => void addEntry()}
        onClose={() => setNewEntryOpen(false)}
      />

      {/* Editing an entry uses the same writing page, without the record and attach buttons (an entry's files aren't changed here). */}
      <EntryEditor
        visible={editingEntry !== undefined}
        dayLabel={editingEntry ? `Editing · ${dayLabel(editingEntry.entry_date, today)} · ${timeOf(editingEntry.created_at)}` : ""}
        draft={editDraft}
        onDraft={setEditDraft}
        canSave={!!editingEntry && editDraft !== editingEntry.body && !update.isPending}
        saving={update.isPending}
        error={error}
        onSave={() => editingEntry && saveEdit(editingEntry)}
        onClose={() => {
          setEditingId(null);
          setEditDraft("");
        }}
      />

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
      {dialog}
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
  // overflow:"hidden" clips the tinted bg to the rounded corners on iOS.
  // On Android, borderRadius clips natively and overflow:"hidden" suppresses elevation on child cards.
  dayCard: { gap: 0, padding: 0, borderRadius: Radius.r4, overflow: Platform.OS === "android" ? "visible" : "hidden" },
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
  emptyLine: { paddingVertical: 8 },
  todayButton: { marginTop: 12 },
});
