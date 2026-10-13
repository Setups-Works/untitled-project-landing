import { applyOpts, DEFAULT_OPTS, emptyDraft, inView, isOverdue, VIEW_TITLES, type ViewKey, type ViewOpts } from "@untitled/logic";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { ListSheet } from "./ListSheet";
import { BoardLayout, CalendarLayout, ListLayout } from "./layouts";
import { useListActions, useTaskActions, useTaskLists, useTasks } from "./queries";
import { useToggleTask } from "./useToggleTask";
import { ViewOptionsSheet } from "./ViewOptionsSheet";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Confirm";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { TextField } from "@/components/ui/TextField";
import { Palette, Radius } from "@/constants/theme";
import { errorMessage } from "@/lib/api";
import { isoDate } from "@untitled/logic";
import type { Task } from "@untitled/types";
import { useAppState } from "@/providers/AppState";

const SMART: ViewKey[] = ["inbox", "today", "upcoming", "overdue", "recurring", "completed", "cancelled", "archived"];
const LAYOUT_ICON: Record<ViewOpts["layout"], IconName> = { list: "list-ul", board: "table-columns", calendar: "calendar-days" };
const NEW_LIST = "__new";

export function TodoScreen() {
  const { preferences, preferencesReady } = useAppState();
  const today = useMemo(() => isoDate(), []);
  const tasksQ = useTasks();
  const listsQ = useTaskLists();
  const toggle = useToggleTask();
  const { add, archiveCompleted, remove } = useTaskActions(today);
  const listActions = useListActions();
  const { ask, dialog } = useConfirm();
  const [view, setView] = useState<ViewKey>("today");
  const [opts, setOpts] = useState<ViewOpts>(DEFAULT_OPTS);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<"view" | "new-list" | "edit-list" | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const appliedStartView = useRef(false);

  useEffect(() => {
    if (!preferencesReady || appliedStartView.current) return;
    appliedStartView.current = true;
    setView(preferences.todoView);
  }, [preferences.todoView, preferencesReady]);

  const tasks = useMemo(() => tasksQ.data ?? [], [tasksQ.data]);
  const lists = useMemo(() => listsQ.data ?? [], [listsQ.data]);
  const activeList = view.startsWith("list:") ? lists.find((l) => l.id === view.slice(5)) : undefined;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([tasksQ.refetch(), listsQ.refetch()]);
    setRefreshing(false);
  }, [tasksQ, listsQ]);

  const inThisView = useMemo(
    () => tasks.filter((t) => inView(t, view, today, opts.showCompleted)),
    [tasks, view, today, opts.showCompleted],
  );
  const completed = tasks.filter((t) => t.done && !t.archived && !t.cancelled);

  // Where a task added from here lands, like the web: due today in Today, in the list when a list is open, else the inbox.
  const defaults = (): Partial<ReturnType<typeof emptyDraft>> =>
    view === "today" ? { due_date: today } : activeList ? { list_id: activeList.id } : {};
  const openEditor = (t: Task) => router.push({ pathname: "/task/[id]", params: { id: t.id } });
  const openNew = (due?: string) =>
    router.push({ pathname: "/task/[id]", params: { id: "new", ...(due ? { due } : {}), ...(activeList ? { list: activeList.id } : {}) } });

  function quickAdd() {
    const t = title.trim();
    if (!t) return;
    setError("");
    add.mutate(emptyDraft({ title: t, ...defaults() }), {
      onSuccess: () => setTitle(""),
      onError: (e) => setError(errorMessage(e, "Couldn’t add that task.")),
    });
  }

  async function confirmDeleteList() {
    if (!activeList) return;
    const ok = await ask({
      title: "Delete this list?",
      body: `${activeList.name}. Its tasks move to the Inbox.`,
      confirmLabel: "Delete list",
      danger: true,
    });
    if (!ok) return;
    listActions.remove.mutate(activeList.id, {
      onSuccess: () => {
        setSheet(null);
        setView("inbox");
      },
      onError: (e) => setError(errorMessage(e, "Couldn’t delete that list.")),
    });
  }

  const options = [
    ...SMART.map((k) => ({
      key: k as string,
      label: VIEW_TITLES[k] ?? k,
      count:
        k === "overdue"
          ? tasks.filter((t) => isOverdue(t, today)).length
          : k === "today"
            ? tasks.filter((t) => inView(t, "today", today, false)).length
            : undefined,
    })),
    ...lists.map((l) => ({ key: `list:${l.id}`, label: l.name })),
    { key: NEW_LIST, label: "+ List" },
  ];

  const ctx = {
    today,
    lists,
    onToggle: toggle,
    onOpen: openEditor,
    onDelete: (t: Task) => remove.mutate(t.id, { onError: (e) => Alert.alert("Couldn’t delete", errorMessage(e)) }),
  };
  const shown = applyOpts(inThisView, opts);

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.head}>
        <AppText variant="title" accessibilityRole="header" style={styles.flex} numberOfLines={1}>
          {activeList ? activeList.name : (VIEW_TITLES[view] ?? "To-do")}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Layout: ${opts.layout}. Open view options`}
          hitSlop={8}
          onPress={() => setSheet("view")}
          style={styles.iconBtn}
        >
          <Icon name={LAYOUT_ICON[opts.layout]} size={16} color={Palette.fg} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View options"
          hitSlop={8}
          onPress={() => setSheet("view")}
          style={styles.iconBtn}
        >
          <Icon name="sliders" size={16} color={Palette.fg} />
        </Pressable>
        <Button title="New" icon="plus" onPress={() => openNew()} style={styles.newBtn} />
      </View>

      <Segmented
        options={options}
        value={view as string}
        onChange={(k) => {
          if (k === NEW_LIST) setSheet("new-list");
          else setView(k as ViewKey);
        }}
      />

      {view !== "completed" && view !== "cancelled" && view !== "archived" ? (
        <View style={styles.add}>
          <View style={styles.flex}>
            <TextField
              label="Quick add"
              value={title}
              onChangeText={setTitle}
              placeholder="What needs doing?"
              maxLength={300}
              returnKeyType="done"
              onSubmitEditing={quickAdd}
              error={error || null}
            />
          </View>
          <Button title="Add" icon="plus" loading={add.isPending} disabled={!title.trim()} onPress={quickAdd} style={styles.addBtn} />
        </View>
      ) : null}

      {activeList ? <Button title="Edit list" kind="ghost" icon="pen" onPress={() => setSheet("edit-list")} style={styles.edit} /> : null}

      {tasksQ.isPending || listsQ.isPending ? (
        <LoadingState />
      ) : tasksQ.isError ? (
        <ErrorState message={errorMessage(tasksQ.error)} onRetry={() => void refresh()} />
      ) : opts.layout === "calendar" ? (
        <CalendarLayout tasks={inThisView} opts={opts} ctx={ctx} onAddOn={openNew} />
      ) : shown.length === 0 ? (
        <EmptyState
          icon="list-check"
          title={view === "today" ? "Nothing due today" : "Nothing here"}
          hint={
            view === "completed" || view === "cancelled" || view === "archived"
              ? "Tasks you finish, cancel or archive show up here."
              : "Add a task to get started."
          }
          action={
            view === "completed" || view === "cancelled" || view === "archived"
              ? undefined
              : { title: "Add a task", onPress: () => openNew(view === "today" ? today : undefined) }
          }
        />
      ) : opts.layout === "board" ? (
        <BoardLayout tasks={inThisView} opts={opts} ctx={ctx} />
      ) : (
        <ListLayout tasks={inThisView} opts={opts} ctx={ctx} />
      )}

      <ViewOptionsSheet
        visible={sheet === "view"}
        opts={opts}
        onChange={(p) => setOpts((o) => ({ ...o, ...p }))}
        onClose={() => setSheet(null)}
        completedCount={completed.length}
        onArchiveCompleted={() =>
          archiveCompleted.mutate(
            completed.map((t) => t.id),
            { onSuccess: () => setSheet(null), onError: (e) => Alert.alert("Couldn’t archive", errorMessage(e)) },
          )
        }
      />
      <ListSheet
        visible={sheet === "new-list"}
        title="New list"
        onClose={() => setSheet(null)}
        onSubmit={(name, color) =>
          listActions.add.mutate(
            { name, color },
            {
              onSuccess: (l) => {
                setSheet(null);
                if (l) setView(`list:${l.id}`);
              },
              onError: (e) => Alert.alert("Couldn’t create the list", errorMessage(e)),
            },
          )
        }
      />
      <ListSheet
        visible={sheet === "edit-list"}
        title="Edit list"
        initialName={activeList?.name}
        initialColor={activeList?.color}
        onClose={() => setSheet(null)}
        onDelete={confirmDeleteList}
        onSubmit={(name) =>
          activeList &&
          listActions.rename.mutate(
            { id: activeList.id, name },
            { onSuccess: () => setSheet(null), onError: (e) => Alert.alert("Couldn’t rename", errorMessage(e)) },
          )
        }
      />
      {dialog}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 6 },
  flex: { flex: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
  newBtn: { minHeight: 40, paddingHorizontal: 16 },
  add: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  addBtn: { paddingHorizontal: 18 },
  edit: { alignSelf: "flex-start", minHeight: 36 },
});
