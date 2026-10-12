import type { Note, Tone } from "@untitled/types";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { runOnJS } from "react-native-worklets";

import { useNoteActions, useNotes } from "./queries";
import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { Sheet } from "@/components/ui/Sheet";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { TextField } from "@/components/ui/TextField";
import { Palette, Radius, Space, Tints } from "@/constants/theme";
import { errorMessage } from "@/lib/api";
import { timeOf } from "@/lib/dates";

const open = (id: string) => router.push({ pathname: "/note/[id]", params: { id } });
const CATEGORIES = ["Others", "Ideas & Creativity", "Personal", "Work", "Learning", "Health"] as const;
type NoteFilter = "all" | "pinned" | "voice";
type NoteSort = "manual" | "edited" | "title";
const AUTO_TONES: Tone[] = ["violet", "blue", "green", "amber", "clay", "mint", "gold"];
type NotePosition = { y: number; height: number };

function noteTitle(note: Note) {
  return note.title.trim() || note.body.split("\n").find((line) => line.trim())?.replace(/^[#>*\-\s]+/, "").slice(0, 80) || "Untitled";
}

function noteTone(note: Note): Tone {
  if (note.color) return note.color;
  let hash = 0;
  for (const character of note.id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return AUTO_TONES[hash % AUTO_TONES.length]!;
}

function editedLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `Edited ${timeOf(iso)}`;
  return `Edited ${date.toLocaleDateString(undefined, { day: "numeric", month: "short", ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}) })}`;
}

export function NotesScreen() {
  const notesQ = useNotes();
  const { create, update, remove } = useNoteActions();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [withAttachments, setWithAttachments] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [actionNote, setActionNote] = useState<Note | null>(null);
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<NoteSort>("manual");
  const [refreshing, setRefreshing] = useState(false);
  const positions = useRef<Record<string, NotePosition>>({});

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await notesQ.refetch();
    setRefreshing(false);
  }, [notesQ]);

  const notes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = notesQ.data ?? [];
    const visible = all.filter((n) =>
      (filter === "all" || (filter === "pinned" ? n.pinned : n.kind === "voice")) &&
      (!categories.length || categories.includes(n.category)) &&
      (!withAttachments || n.attachments.length > 0) &&
      (!q || `${n.title} ${n.body} ${n.category}`.toLowerCase().includes(q)),
    );
    const compare: Record<NoteSort, (a: Note, b: Note) => number> = {
      manual: (a, b) => b.sort_order - a.sort_order,
      edited: (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      title: (a, b) => noteTitle(a).localeCompare(noteTitle(b)),
    };
    return visible.sort((a, b) => Number(b.pinned) - Number(a.pinned) || compare[sort](a, b));
  }, [notesQ.data, query, filter, categories, withAttachments, sort]);

  const filtersOn = categories.length + Number(withAttachments);
  const canDrag = sort === "manual" && !query.trim() && filter === "all" && categories.length === 0 && !withAttachments;

  function recordPosition(id: string, event: LayoutChangeEvent) {
    const { y, height } = event.nativeEvent.layout;
    positions.current[id] = { y, height };
  }

  function finishDrag(note: Note, translationY: number) {
    if (!canDrag) return;
    const start = positions.current[note.id];
    if (!start) return;

    const siblings = notes.filter((item) => item.pinned === note.pinned);
    const projectedCenter = start.y + start.height / 2 + translationY;
    const remaining = siblings.filter((item) => item.id !== note.id);
    const targetIndex = remaining.filter((item) => {
      const position = positions.current[item.id];
      return position && position.y + position.height / 2 < projectedCenter;
    }).length;
    const currentIndex = siblings.findIndex((item) => item.id === note.id);
    if (targetIndex === currentIndex) return;

    const above = remaining[targetIndex - 1];
    const below = remaining[targetIndex];
    const sortOrder = above && below ? (above.sort_order + below.sort_order) / 2 : below ? below.sort_order + 1000 : above ? above.sort_order - 1000 : note.sort_order;
    void changeNote(note.id, { sort_order: sortOrder });
  }

  async function duplicateNote(note: Note) {
    setError("");
    try {
      const copy = await create.mutateAsync({ title: `${noteTitle(note)} (copy)`.slice(0, 200), body: note.body, category: note.category, color: note.color, pinned: false });
      open(copy.data.id);
    } catch (e) {
      setError(errorMessage(e, "Couldn’t duplicate that note."));
    }
  }

  function toggleCategory(category: string) {
    setCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  }

  async function changeNote(id: string, changes: { pinned?: boolean; sort_order?: number }) {
    setError("");
    try {
      await update.mutateAsync({ id, ...changes });
    } catch (e) {
      setError(errorMessage(e, "Couldn’t save that change."));
    }
  }

  async function moveNote(note: Note, direction: -1 | 1) {
    const siblings = (notesQ.data ?? []).filter((item) => item.pinned === note.pinned).sort((a, b) => b.sort_order - a.sort_order);
    const currentIndex = siblings.findIndex((item) => item.id === note.id);
    const nextIndex = Math.max(0, Math.min(siblings.length - 1, currentIndex + direction));
    if (currentIndex < 0 || currentIndex === nextIndex) return;
    const reordered = siblings.filter((item) => item.id !== note.id);
    reordered.splice(nextIndex, 0, note);
    const above = reordered[nextIndex - 1];
    const below = reordered[nextIndex + 1];
    const sortOrder = above && below ? (above.sort_order + below.sort_order) / 2 : below ? below.sort_order + 1000 : above ? above.sort_order - 1000 : note.sort_order;
    await changeNote(note.id, { sort_order: sortOrder });
    setActionNote(null);
  }

  async function confirmDelete() {
    if (!deleteNote) return;
    setError("");
    try {
      await remove.mutateAsync(deleteNote.id);
      setDeleteNote(null);
    } catch (e) {
      setError(errorMessage(e, "Couldn’t delete that note."));
    }
  }

  function noteSiblings(note: Note) {
    return (notesQ.data ?? []).filter((item) => item.pinned === note.pinned).sort((a, b) => b.sort_order - a.sort_order);
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.head}>
        <View style={styles.titleWithCount}>
          <AppText variant="title" accessibilityRole="header">Notes</AppText>
          {notesQ.data ? <AppText variant="small" color={Palette.fgSubtle}>{notesQ.data.length}</AppText> : null}
        </View>
        <View style={styles.headActions}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Sort notes, currently ${sort}`} onPress={() => setSortOpen(true)} style={styles.optionsButton}>
            <Icon name="ellipsis" size={17} color={Palette.fgMuted} />
          </Pressable>
          <Button title="New note" icon="plus" onPress={() => open("new")} />
        </View>
      </View>
      {notesQ.data?.length ? (
        <TextField label="Search notes" value={query} onChangeText={setQuery} placeholder="Search…" returnKeyType="search" />
      ) : null}

      <View style={styles.filters} accessibilityRole="toolbar" accessibilityLabel="Filter notes">
        {(["all", "pinned", "voice"] as const).map((key) => (
          <FilterPill key={key} title={{ all: "All notes", pinned: "Pinned", voice: "Voice" }[key]} selected={filter === key} onPress={() => setFilter(key)} />
        ))}
        <FilterPill title="More filters" badge={filtersOn || undefined} selected={filtersOpen} onPress={() => setFiltersOpen(true)} />
      </View>

      <Sheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} title="More filters">
        <AppText variant="label" style={styles.sectionLabel}>Category</AppText>
        {CATEGORIES.map((category) => {
          const selected = categories.includes(category);
          return (
            <Pressable
              key={category}
              accessibilityRole="checkbox"
              accessibilityLabel={category}
              accessibilityState={{ checked: selected }}
              onPress={() => toggleCategory(category)}
              style={styles.filterOption}
            >
              <AppText variant="body">{category}</AppText>
              <View style={[styles.check, selected ? styles.checkSelected : null]}>
                {selected ? <Icon name="check" size={12} color={Palette.onDark} /> : null}
              </View>
            </Pressable>
          );
        })}
        <View style={styles.separator} />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="With attachments"
          accessibilityState={{ checked: withAttachments }}
          onPress={() => setWithAttachments((value) => !value)}
          style={styles.filterOption}
        >
          <AppText variant="body">With attachments</AppText>
          <View style={[styles.check, withAttachments ? styles.checkSelected : null]}>
            {withAttachments ? <Icon name="check" size={12} color={Palette.onDark} /> : null}
          </View>
        </Pressable>
        {filtersOn ? (
          <Pressable accessibilityRole="button" onPress={() => { setCategories([]); setWithAttachments(false); }} style={styles.clearFilters}>
            <AppText variant="bodyStrong" color={Palette.greenFg}>Clear filters</AppText>
          </Pressable>
        ) : null}
      </Sheet>

      <Sheet visible={sortOpen} onClose={() => setSortOpen(false)} title="Sort and options">
        <AppText variant="label" style={styles.sectionLabel}>Sort by</AppText>
        {([
          ["manual", "Manual order", "Reorder notes from each card"],
          ["edited", "Last edited", "Recently changed first"],
          ["title", "Title A–Z", "Alphabetical order"],
        ] as const).map(([value, label, hint]) => (
          <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: sort === value }} onPress={() => { setSort(value); setSortOpen(false); }} style={styles.sortOption}>
            <View style={styles.sortCopy}>
              <AppText variant="bodyStrong">{label}</AppText>
              <AppText variant="small" color={Palette.fgSubtle}>{hint}</AppText>
            </View>
            <View style={[styles.radio, sort === value ? styles.radioOn : null]}>{sort === value ? <View style={styles.radioDot} /> : null}</View>
          </Pressable>
        ))}
      </Sheet>

      {error ? <Banner kind="error">{error}</Banner> : null}
      {notesQ.isPending ? (
        <LoadingState />
      ) : notesQ.isError ? (
        <ErrorState message={errorMessage(notesQ.error)} onRetry={() => void notesQ.refetch()} />
      ) : notes.length ? (
        <View style={styles.noteList}>
          {notes.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              canDrag={canDrag}
              onLayout={(event) => recordPosition(n.id, event)}
              onDragFinish={(translationY) => finishDrag(n, translationY)}
              onOpen={() => open(n.id)}
              onAction={() => setActionNote(n)}
              onDelete={() => setDeleteNote(n)}
            />
          ))}
        </View>
      ) : notesQ.data?.length ? (
        <EmptyState icon="magnifying-glass" title="No notes match those filters" hint="Try changing or clearing your filters." />
      ) : (
        <EmptyState
          icon="note-sticky"
          title="No notes yet"
          hint="Capture an idea, a link, anything you want to keep."
          action={{ title: "New note", onPress: () => open("new") }}
        />
      )}

      <Sheet visible={actionNote !== null} onClose={() => setActionNote(null)} title={actionNote ? noteTitle(actionNote) : "Note options"}>
        {actionNote ? (
          <View style={styles.noteActions}>
            <OptionAction icon="thumbtack" title={actionNote.pinned ? "Unpin note" : "Pin note"} onPress={() => { const note = actionNote; setActionNote(null); void changeNote(note.id, { pinned: !note.pinned }); }} />
            <OptionAction icon="clone" title="Duplicate" onPress={() => { const note = actionNote; setActionNote(null); void duplicateNote(note); }} />
            <OptionAction icon="arrow-up" title="Move up" disabled={sort !== "manual" || noteSiblings(actionNote)[0]?.id === actionNote.id} onPress={() => void moveNote(actionNote, -1)} />
            <OptionAction icon="arrow-down" title="Move down" disabled={sort !== "manual" || noteSiblings(actionNote).slice(-1)[0]?.id === actionNote.id} onPress={() => void moveNote(actionNote, 1)} />
          </View>
        ) : null}
      </Sheet>

      <Sheet visible={deleteNote !== null} onClose={() => setDeleteNote(null)} title="Delete this note?">
        <AppText variant="body" color={Palette.fgMuted} style={styles.deleteMessage}>
          “{deleteNote ? noteTitle(deleteNote) : ""}” and its attachments will be permanently deleted. This can’t be undone.
        </AppText>
        {error ? <Banner kind="error">{error}</Banner> : null}
        <Button title="Delete note" kind="danger" icon="trash" loading={remove.isPending} onPress={() => void confirmDelete()} />
        <Button title="Cancel" kind="secondary" onPress={() => setDeleteNote(null)} />
      </Sheet>
    </Screen>
  );
}

function FilterPill({ title, selected, badge, onPress }: { title: string; selected: boolean; badge?: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${title}, ${badge} active filters` : title}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.filterPill, selected ? styles.filterPillSelected : null, pressed ? styles.pressed : null]}
    >
      <AppText variant="body" color={selected ? Palette.fg : Palette.fgMuted}>{title}</AppText>
      {badge ? <View style={styles.badge}><AppText variant="small" color={Palette.onDark} style={styles.badgeText}>{badge}</AppText></View> : null}
    </Pressable>
  );
}

function NoteCard({
  note,
  canDrag,
  onLayout,
  onDragFinish,
  onOpen,
  onAction,
  onDelete,
}: {
  note: Note;
  canDrag: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
  onDragFinish: (translationY: number) => void;
  onOpen: () => void;
  onAction: () => void;
  onDelete: () => void;
}) {
  const dragY = useSharedValue(0);
  const dragActive = useSharedValue(0);
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
    zIndex: dragActive.value,
    elevation: dragActive.value ? 5 : 0,
    opacity: dragActive.value ? 0.9 : 1,
  }));
  const dragGesture = Gesture.Pan()
    .enabled(canDrag)
    .activateAfterLongPress(250)
    .onStart(() => {
      // Reanimated shared values are updated on the UI thread during the gesture.
      // eslint-disable-next-line react-hooks/immutability
      dragActive.value = 1;
    })
    .onUpdate((event) => {
      // This shared value is owned by Reanimated and updated on the UI thread.
      // eslint-disable-next-line react-hooks/immutability
      dragY.value = event.translationY;
    })
    .onEnd((event) => runOnJS(onDragFinish)(event.translationY))
    .onFinalize(() => {
      // This shared value is owned by Reanimated and updated on the UI thread.
      // eslint-disable-next-line react-hooks/immutability
      dragY.value = withSpring(0);
      // eslint-disable-next-line react-hooks/immutability
      dragActive.value = 0;
    });
  const tone = noteTone(note);
  return (
    <Animated.View onLayout={onLayout} style={animatedCardStyle}>
      <Card tone={tone} onPress={onOpen} accessibilityLabel={`Open note: ${noteTitle(note)}`} style={styles.noteCard}>
        <View style={styles.cardGrip}>
          {canDrag ? (
            <GestureDetector gesture={dragGesture}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Reorder ${noteTitle(note)}`}
                accessibilityHint="Long press and drag to change the note order. Tap for more options."
                accessibilityActions={[{ name: "activate", label: "Open note options" }]}
                onAccessibilityAction={onAction}
                onPress={onAction}
                style={styles.cardIconButton}
              >
                <Icon name="grip-vertical" size={15} color={Palette.fgFaint} />
              </Pressable>
            </GestureDetector>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Options for ${noteTitle(note)}`}
              accessibilityHint="Opens note options."
              onPress={onAction}
              style={styles.cardIconButton}
            >
              <Icon name="ellipsis" size={15} color={Palette.fgFaint} />
            </Pressable>
          )}
          <View style={styles.flex} />
          {note.pinned ? <Icon name="thumbtack" size={14} color={Tints[tone].fg} /> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${noteTitle(note)}`} onPress={onDelete} style={styles.cardIconButton}>
            <Icon name="trash" size={16} color={Palette.clayFg} />
          </Pressable>
        </View>
        <AppText variant="heading" numberOfLines={2} style={styles.noteTitle}>{noteTitle(note)}</AppText>
        {note.kind === "voice" ? <View style={styles.metaChip}><Icon name="wave-square" size={13} color={Tints[tone].fg} /><AppText variant="small">Voice note</AppText></View> : null}
        {note.body.trim() ? <View style={styles.preview}><Markdown text={note.body} /></View> : null}
        {note.attachments.length > 0 && note.kind !== "voice" ? (
          <View style={styles.metaChip}><Icon name="paperclip" size={13} color={Tints[tone].fg} /><AppText variant="small">{note.attachments.length} attached</AppText></View>
        ) : null}
        {note.attachments.length ? <AttachmentGallery attachments={note.attachments.slice(0, 1)} /> : null}
        <View style={[styles.cardFooter, { borderTopColor: Tints[tone].line }]}>
          <AppText variant="bodyStrong" color={Tints[tone].fg} style={styles.category}>{note.category || "Others"}</AppText>
          <AppText variant="small" color={Palette.fgSubtle}>{editedLabel(note.updated_at)}</AppText>
        </View>
      </Card>
    </Animated.View>
  );
}

function OptionAction({ icon, title, onPress, disabled = false }: { icon: "thumbtack" | "clone" | "arrow-up" | "arrow-down"; title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.optionAction, disabled ? styles.optionDisabled : null]}>
      <Icon name={icon} size={16} color={Palette.fgSubtle} />
      <AppText variant="body">{title}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titleWithCount: { flexDirection: "row", alignItems: "center", gap: 8 },
  headActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  optionsButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: Radius.pill, borderWidth: 1, borderColor: Palette.glassRing, backgroundColor: Palette.glassHi },
  filters: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  filterPill: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: Palette.glassRing, backgroundColor: Palette.glassHi },
  filterPillSelected: { borderWidth: 2, borderColor: Palette.fillDark, backgroundColor: Palette.surface },
  pressed: { opacity: 0.82 },
  badge: { minWidth: 19, height: 19, borderRadius: 999, paddingHorizontal: 5, alignItems: "center", justifyContent: "center", backgroundColor: Palette.fillDark },
  badgeText: { color: Palette.onDark, fontSize: 11, lineHeight: 14 },
  sectionLabel: { marginBottom: 4 },
  filterOption: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  check: { width: 22, height: 22, borderRadius: 999, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Palette.lineStrong },
  checkSelected: { borderColor: Palette.fillDark, backgroundColor: Palette.fillDark },
  separator: { height: 1, backgroundColor: Palette.line, marginVertical: 6 },
  clearFilters: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  noteCard: { gap: 10, paddingHorizontal: 18, paddingVertical: 16 },
  cardGrip: { minHeight: 28, flexDirection: "row", alignItems: "center", gap: 12 },
  cardIconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: Radius.pill },
  noteTitle: { fontSize: 25, lineHeight: 29, marginTop: 1 },
  preview: { maxHeight: 154, overflow: "hidden" },
  metaChip: { minHeight: 30, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, borderRadius: Radius.pill, backgroundColor: Palette.glassHi },
  cardFooter: { minHeight: 38, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 3, paddingTop: 10, borderTopWidth: 1 },
  category: { fontSize: 13, lineHeight: 18, letterSpacing: 0.5, textTransform: "uppercase" },
  optionAction: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 8 },
  optionDisabled: { opacity: 0.45 },
  noteActions: { gap: 2 },
  noteList: { width: "100%", gap: Space.lg },
  sortOption: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12 },
  sortCopy: { flex: 1, gap: 2 },
  radio: { width: 22, height: 22, borderWidth: 1, borderColor: Palette.lineStrong, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: Palette.greenFg },
  radioDot: { width: 12, height: 12, borderRadius: Radius.pill, backgroundColor: Palette.greenFg },
  deleteMessage: { marginBottom: 8 },
  flex: { flex: 1 },
});
