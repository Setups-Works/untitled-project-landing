import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Attachment, JournalEntry } from "@untitled/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { useJournal, useJournalActions, useJournalDay } from "./queries";
import { EntryEditor } from "@/components/ui/EntryEditor";
import { EntryEditSheet } from "./EntryEditSheet";
import { EntryShareSheet } from "./EntryShareSheet";
import { FeedEntry } from "./FeedEntry";
import { MAX_UPLOAD_BYTES, uploadJournalFile } from "./files";
import { pickFiles, type PendingFile } from "@/features/chat/files";
import { useRecorder } from "@/features/chat/useRecorder";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { CalendarGrid } from "@/components/ui/DatePicker";
import { useConfirm } from "@/components/ui/Confirm";
import { Card } from "@/components/ui/Card";
import { DayNav } from "@/components/ui/DayNav";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { Screen, type ScreenEdges } from "@/components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Font, Palette, Radius, Space, toneAt } from "@/constants/theme";
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

export function JournalScreen({ edges }: { edges?: ScreenEdges } = {}) {
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
  // `/journal?new=1` (from the Quick write widget) opens the writing page straight away; closing it clears the address again.
  const { new: openNew } = useLocalSearchParams<{ new?: string }>();
  const writing = newEntryOpen || openNew === "1";
  const closeNewEntry = () => {
    setNewEntryOpen(false);
    if (openNew) router.setParams({ new: undefined });
  };
  const [actionEntry, setActionEntry] = useState<JournalEntry | null>(null);
  const [shareEntry, setShareEntry] = useState<JournalEntry | null>(null);
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
        closeNewEntry();
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

  const dayName = date === today ? "Today" : selectedDate.toLocaleDateString(undefined, { weekday: "long" });

  return (
    <Screen edges={edges} onRefresh={() => void refresh()} refreshing={refreshing}>
      <View style={styles.header}>
        <View style={styles.headTitle}>
          <AppText variant="title" numberOfLines={1} accessibilityRole="header">
            {dayName}
          </AppText>
          <AppText variant="small" color={Palette.fgSubtle}>
            {dayQ.isPending ? " " : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
          </AppText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="New entry" onPress={() => setNewEntryOpen(true)} style={styles.add}>
          <Icon name="plus" size={14} color={Palette.onDark} />
          <AppText variant="bodyStrong" color={Palette.onDark}>
            Add
          </AppText>
        </Pressable>
      </View>

      <DayNav
        label={title}
        accessibilityLabel={`${title}. Choose date.`}
        nextDisabled={date >= today}
        onPrev={() => {
          setEditingId(null);
          setDate((current) => addDays(current, -1));
        }}
        onNext={() => {
          setEditingId(null);
          setDate((current) => addDays(current, 1));
        }}
        onOpen={() => setCalendarOpen(true)}
      />

      {dayQ.isPending ? (
        <LoadingState label="Loading entries…" />
      ) : dayQ.isError ? (
        <ErrorState message={errorMessage(dayQ.error)} onRetry={() => void dayQ.refetch()} />
      ) : entries.length ? (
        <View style={styles.feed}>
          {entries.map((entry, index) => (
            <FeedEntry
              key={entry.id}
              entry={entry}
              tone={toneAt(index)}
              onOpen={() => router.push({ pathname: "/journal/[id]", params: { id: entry.id } })}
              onMenu={() => setActionEntry(entry)}
            />
          ))}
        </View>
      ) : (
        <Card tone="sand" onPress={() => setNewEntryOpen(true)} accessibilityLabel="Write an entry" style={styles.empty}>
          <AppText style={styles.emptyText}>{date === today ? "Nothing written yet today. What’s on your mind?" : "No entries on this day."}</AppText>
        </Card>
      )}

      {!allQ.isPending && !allQ.isError && allQ.data?.length === 0 ? (
        <EmptyState icon="book-open" title="Your journal is ready" hint="Write a line. One sentence is enough." />
      ) : null}

      <EntryEditor
        visible={writing}
        inputLabel="Journal entry"
        label={`${dayLabel(date, today)} · ${selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`}
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
        onClose={closeNewEntry}
      />

      {/* Editing an entry uses the same writing page, with its files: each can be removed, and more can be added. */}
      {editingEntry ? (
        <EntryEditSheet
          key={editingEntry.id}
          entry={editingEntry}
          onClose={() => setEditingId(null)}
          onSaved={() => setEditingId(null)}
          onDeleted={() => setEditingId(null)}
        />
      ) : null}

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

      <Sheet visible={actionEntry !== null} onClose={() => setActionEntry(null)} title="Entry">
        <Pressable
          accessibilityRole="button"
          style={styles.actionRow}
          onPress={() => {
            const entry = actionEntry;
            setActionEntry(null);
            if (entry) {
              setError("");
              setEditingId(entry.id);
            }
          }}
        >
          <AppText variant="body">Edit</AppText>
          <Icon name="pen" size={15} color={Palette.fgMuted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.actionRow}
          onPress={() => {
            const entry = actionEntry;
            setActionEntry(null);
            if (entry) setShareEntry(entry);
          }}
        >
          <AppText variant="body">Share</AppText>
          <Icon name="share-nodes" size={15} color={Palette.fgMuted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.actionRow}
          onPress={() => {
            const entry = actionEntry;
            setActionEntry(null);
            if (entry) void removeEntry(entry);
          }}
        >
          <AppText variant="body" color={Palette.clayFg}>
            Delete
          </AppText>
          <Icon name="trash-can" size={15} color={Palette.clayFg} />
        </Pressable>
      </Sheet>
      {shareEntry ? <EntryShareSheet key={shareEntry.id} entry={shareEntry} onClose={() => setShareEntry(null)} /> : null}
      {dialog}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Space.md },
  headTitle: { flex: 1, minWidth: 0 },
  add: { flexDirection: "row", alignItems: "center", gap: 6, height: 44, paddingHorizontal: Space.lg, borderRadius: Radius.pill, backgroundColor: Palette.fillDark },
  feed: { gap: Space.md },
  empty: { padding: Space.xl, borderRadius: Radius.r3 },
  emptyText: { ...Font.serif, fontSize: 24, lineHeight: 32, color: Palette.fgSubtle },
  actionRow: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  todayButton: { marginTop: 12 },
});
