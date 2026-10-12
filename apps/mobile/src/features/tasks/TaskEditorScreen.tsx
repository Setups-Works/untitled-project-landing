import { dayLabel, emptyDraft, firstDue, PRIORITIES, recurrenceChoices, recurrenceLabel, type Draft } from "@untitled/logic";
import type { Task, TaskList } from "@untitled/types";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { useTaskActions, useTaskLists, useTasks } from "./queries";
import { useToggleTask } from "./useToggleTask";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { BarButton, DetailBar } from "@/components/ui/DetailBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Markdown } from "@/components/ui/Markdown";
import { DateField } from "@/components/ui/DatePicker";
import { PickerField } from "@/components/ui/PickerField";
import { Screen } from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { TextField } from "@/components/ui/TextField";
import { Palette } from "@/constants/theme";
import { errorMessage } from "@/lib/api";
import { isoDate } from "@untitled/logic";

/** Create or edit one task: title, notes, due date, priority, list and repeat (the web's task dialog). */
export function TaskEditorScreen() {
  const { id, due, list } = useLocalSearchParams<{ id: string; due?: string; list?: string }>();
  const tasksQ = useTasks();
  const listsQ = useTaskLists();
  if (id === "new")
    return <Form task={null} initial={emptyDraft({ due_date: due ?? null, list_id: list ?? null })} lists={listsQ.data ?? []} />;
  if (tasksQ.isError)
    return (
      <Screen>
        <ErrorState message={errorMessage(tasksQ.error)} onRetry={() => void tasksQ.refetch()} />
      </Screen>
    );
  const task = tasksQ.data?.find((t) => t.id === id);
  if (!tasksQ.data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (!task)
    return (
      <Screen>
        <ErrorState message="This task no longer exists." onRetry={() => router.back()} />
      </Screen>
    );
  return <TaskScreen task={task} lists={listsQ.data ?? []} />;
}

/** An existing task opens as a page; the form only appears after tapping Edit, and saving returns to the page. */
function TaskScreen({ task, lists }: { task: Task; lists: TaskList[] }) {
  const [editing, setEditing] = useState(false);
  const toggle = useToggleTask();
  if (editing)
    return (
      <Form
        task={task}
        initial={{
          title: task.title,
          description: task.description,
          due_date: task.due_date,
          priority: task.priority,
          list_id: task.list_id,
          recurrence: task.recurrence,
        }}
        lists={lists}
        onSaved={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  const today = isoDate();
  const list = lists.find((l) => l.id === task.list_id);
  const priority = PRIORITIES.find((p) => p.p === task.priority)?.label;
  const status = task.cancelled ? "Cancelled" : task.archived ? "Archived" : task.done ? "Done" : null;
  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <DetailBar label="Task" onClose={() => router.back()} action={<BarButton title="Edit" onPress={() => setEditing(true)} />} />
      <AppText
        variant="title"
        color={task.done || task.cancelled ? Palette.fgFaint : Palette.fg}
        style={task.done ? { textDecorationLine: "line-through" } : null}
      >
        {task.title}
      </AppText>
      {status ? (
        <AppText variant="label" color={Palette.greenFg}>
          {status}
        </AppText>
      ) : null}
      <Card tone="violet" style={{ gap: 12 }}>
        <Detail
          label="Due"
          value={task.due_date ? dayLabel(task.due_date, today) : "No date"}
          danger={!task.done && !!task.due_date && task.due_date < today}
        />
        <Detail label="Priority" value={priority ?? "—"} />
        <Detail label="List" value={list?.name ?? "Inbox"} />
        <Detail label="Repeat" value={recurrenceLabel(task.recurrence)} />
      </Card>
      {task.description ? <Markdown text={task.description} /> : null}
      {!task.cancelled && !task.archived ? (
        <Button
          title={task.done ? "Mark as not done" : "Mark as done"}
          icon={task.done ? "rotate-left" : "check"}
          kind={task.done ? "secondary" : "primary"}
          onPress={() => toggle(task)}
        />
      ) : null}
    </Screen>
  );
}

function Detail({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
      <AppText variant="small">{label}</AppText>
      <AppText variant="bodyStrong" color={danger ? Palette.clayFg : Palette.fg}>
        {value}
      </AppText>
    </View>
  );
}

function Form({
  task,
  initial,
  lists,
  onSaved,
  onCancel,
}: {
  task: Task | null;
  initial: Draft;
  lists: { id: string; name: string }[];
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const today = isoDate();
  const { add, patch, remove } = useTaskActions(today);
  const [d, setD] = useState<Draft>(initial);
  const [error, setError] = useState("");
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const busy = add.isPending || patch.isPending || remove.isPending;
  const done = {
    onSuccess: () => (onSaved ? onSaved() : router.back()),
    onError: (e: unknown) => setError(errorMessage(e, "Couldn’t save the task.")),
  };

  function save() {
    setError("");
    if (!d.title.trim()) return setError("Give the task a title.");
    const values = { ...d, title: d.title.trim(), due_date: firstDue(d.due_date, d.recurrence, today) };
    if (task) patch.mutate({ id: task.id, changes: values }, done);
    else add.mutate(values, done);
  }

  function confirmDelete() {
    if (!task) return;
    Alert.alert("Delete this task?", task.title, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove.mutate(task.id, done) },
    ]);
  }

  const repeat = recurrenceChoices(d.due_date, d.recurrence);

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
        <AppText variant="label">{task ? "Edit task" : "New task"}</AppText>
        <View style={styles.spacer} />
      </View>

      <TextField label="Title" value={d.title} onChangeText={(title) => set({ title })} maxLength={300} autoFocus={!task} />
      <TextField
        label="Notes"
        value={d.description}
        onChangeText={(description) => set({ description })}
        multiline
        minHeight={100}
        maxLength={5000}
      />
      <DateField label="Due date" value={d.due_date} onChange={(due_date) => set({ due_date })} />
      <PickerField
        label="Priority"
        value={d.priority}
        options={PRIORITIES.map((p) => ({ value: p.p as number, label: p.label }))}
        onChange={(p) => set({ priority: p as Draft["priority"] })}
      />
      <PickerField
        label="List"
        value={d.list_id ?? ""}
        options={[{ value: "", label: "Inbox" }, ...lists.map((l) => ({ value: l.id, label: l.name }))]}
        onChange={(v) => set({ list_id: v || null })}
      />
      <PickerField
        label="Repeat"
        value={d.recurrence ?? ""}
        options={repeat.map(([value, label]) => ({ value, label }))}
        onChange={(v) => set({ recurrence: v || null })}
      />

      {error ? <Banner kind="error">{error}</Banner> : null}
      <Button title={task ? "Save changes" : "Add task"} loading={add.isPending || patch.isPending} disabled={busy} onPress={save} />
      {task ? (
        <View style={styles.more}>
          <Button
            title={task.cancelled ? "Restore" : "Cancel task"}
            kind="secondary"
            icon={task.cancelled ? "rotate-left" : "ban"}
            disabled={busy}
            onPress={() => patch.mutate({ id: task.id, changes: { cancelled: !task.cancelled } }, done)}
            style={styles.flex}
          />
          <Button
            title={task.archived ? "Unarchive" : "Archive"}
            kind="secondary"
            icon="box-archive"
            disabled={busy}
            onPress={() => patch.mutate({ id: task.id, changes: { archived: !task.archived } }, done)}
            style={styles.flex}
          />
        </View>
      ) : null}
      {task ? (
        <Button title="Delete task" kind="danger" icon="trash" loading={remove.isPending} disabled={busy} onPress={confirmDelete} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 36 },
  spacer: { width: 40 },
  more: { flexDirection: "row", gap: 10 },
  flex: { flex: 1, paddingHorizontal: 10 },
});
