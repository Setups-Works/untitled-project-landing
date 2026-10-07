"use client";
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabaseBrowser } from "../../lib/supabase/client";
import { qk } from "../../lib/query/keys";
import { nextDue, type Draft } from "../../lib/tasks";
import type { Task, TaskList } from "../../lib/workspace";

/**
 * Data layer for tasks and lists, on TanStack Query. This is the REFERENCE for migrating the other features:
 *   - reads are `useQuery` (cached, deduplicated, refetched on focus/reconnect, refreshed by realtime)
 *   - writes are `useMutation` with an optimistic cache update, rollback on error, and invalidation when settled
 *   - every cached list of tasks (To-do page AND Home card) is updated at once, because they share the ["tasks"] key prefix
 * Components never call Supabase for tasks directly; they use these hooks.
 *
 * Today the queries talk to Supabase straight from the browser (RLS protects them). When the API v1 layer lands
 * (UNT-56/57/61) only the `queryFn` / `mutationFn` bodies change — components and cache logic stay the same.
 */

const TASK_COLS = "id,title,description,priority,list_id,due_date,done,done_at,cancelled,archived,recurrence,created_at";
const LIST_COLS = "id,name,color,created_at";
const EMPTY_TASKS: Task[] = [];
const EMPTY_LISTS: TaskList[] = [];

export function useTasks() {
  const sb = useMemo(supabaseBrowser, []);
  const q = useQuery({
    queryKey: qk.tasks.list,
    queryFn: async () => {
      const { data, error } = await sb.from("tasks").select(TASK_COLS).order("created_at").limit(5000);
      if (error) throw error;
      return data as Task[];
    },
  });
  return { ...q, tasks: q.data ?? EMPTY_TASKS };
}

export function useTaskLists() {
  const sb = useMemo(supabaseBrowser, []);
  const q = useQuery({
    queryKey: qk.taskLists,
    queryFn: async () => {
      const { data, error } = await sb.from("task_lists").select(LIST_COLS).order("created_at");
      if (error) throw error;
      return data as TaskList[];
    },
  });
  return { ...q, lists: q.data ?? EMPTY_LISTS };
}

type Snapshot = [QueryKey, Task[] | undefined][];

/** All task mutations. `onError` receives a friendly message to show the user. Each action resolves to its result, or `undefined` if it failed. */
export function useTaskActions(onError: (message: string) => void, today: string) {
  const sb = useMemo(supabaseBrowser, []);
  const qc = useQueryClient();

  // Apply a change to every cached task list (To-do page, Home card…) at once.
  const mapAll = (fn: (all: Task[]) => Task[]) => qc.setQueriesData<Task[]>({ queryKey: qk.tasks.all }, (old) => (old ? fn(old) : old));
  const snapshot = async (): Promise<Snapshot> => {
    await qc.cancelQueries({ queryKey: qk.tasks.all }); // so an in-flight refetch can't overwrite the optimistic change
    return qc.getQueriesData<Task[]>({ queryKey: qk.tasks.all });
  };
  const rollback = (snap?: Snapshot) => snap?.forEach(([key, data]) => qc.setQueryData(key, data));
  const refresh = () => qc.invalidateQueries({ queryKey: qk.tasks.all });
  const fail = (message: string) => (_e: unknown, _v: unknown, ctx?: { snap: Snapshot }) => {
    rollback(ctx?.snap);
    onError(message);
  };

  const patch = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<Task> }) => {
      const { error } = await sb.from("tasks").update(changes).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, changes }) => {
      const snap = await snapshot();
      mapAll((all) => all.map((t) => (t.id === id ? { ...t, ...changes } : t)));
      return { snap };
    },
    onError: fail("Couldn’t save that change."),
    onSettled: refresh,
  });

  const add = useMutation({
    mutationFn: async (d: Draft) => {
      const { error } = await sb.from("tasks").insert({
        title: d.title,
        description: d.description,
        due_date: d.due_date,
        priority: d.priority,
        list_id: d.list_id,
        recurrence: d.recurrence,
      });
      if (error) throw error;
    },
    onError: () => onError("Couldn’t add that task."),
    onSettled: refresh,
  });

  /** Complete / un-complete. Completing a repeating task also schedules its next occurrence. */
  const toggle = useMutation({
    mutationFn: async (t: Task) => {
      const done = !t.done;
      const { error } = await sb
        .from("tasks")
        .update({ done, done_at: done ? new Date().toISOString() : null })
        .eq("id", t.id);
      if (error) throw error;
      if (done && t.recurrence && t.due_date) {
        const { error: e2 } = await sb.from("tasks").insert({
          title: t.title,
          description: t.description,
          due_date: nextDue(t.due_date, t.recurrence, today),
          priority: t.priority,
          list_id: t.list_id,
          recurrence: t.recurrence,
        });
        if (e2) throw e2;
      }
    },
    onMutate: async (t) => {
      const snap = await snapshot();
      const done = !t.done;
      mapAll((all) => all.map((x) => (x.id === t.id ? { ...x, done, done_at: done ? new Date().toISOString() : null } : x)));
      return { snap };
    },
    onError: fail("Couldn’t update that task."),
    onSettled: refresh,
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await sb.from("tasks").delete().in("id", ids);
      if (error) throw error;
    },
    onMutate: async (ids) => {
      const snap = await snapshot();
      mapAll((all) => all.filter((t) => !ids.includes(t.id)));
      return { snap };
    },
    onError: fail("Couldn’t delete that."),
    onSettled: refresh,
  });

  const reschedule = useMutation({
    mutationFn: async ({ ids, date }: { ids: string[]; date: string }) => {
      const { error } = await sb.from("tasks").update({ due_date: date }).in("id", ids);
      if (error) throw error;
    },
    onMutate: async ({ ids, date }) => {
      const snap = await snapshot();
      mapAll((all) => all.map((t) => (ids.includes(t.id) ? { ...t, due_date: date } : t)));
      return { snap };
    },
    onError: fail("Couldn’t reschedule."),
    onSettled: refresh,
  });

  const archiveCompleted = useMutation({
    mutationFn: async () => {
      const { error } = await sb.from("tasks").update({ archived: true }).eq("done", true).eq("archived", false);
      if (error) throw error;
    },
    onMutate: async () => {
      const snap = await snapshot();
      mapAll((all) => all.map((t) => (t.done ? { ...t, archived: true } : t)));
      return { snap };
    },
    onError: fail("Couldn’t archive tasks."),
    onSettled: refresh,
  });

  /* ---- lists ---- */
  const addList = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await sb.from("task_lists").insert({ name, color }).select(LIST_COLS).single();
      if (error || !data) throw error ?? new Error("no row");
      return data as TaskList;
    },
    onSuccess: (row) => qc.setQueryData<TaskList[]>(qk.taskLists, (old) => [...(old ?? []), row]),
    onError: () => onError("Couldn’t create that list."),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.taskLists }),
  });

  const renameList = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await sb.from("task_lists").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, name }) => {
      await qc.cancelQueries({ queryKey: qk.taskLists });
      const prev = qc.getQueryData<TaskList[]>(qk.taskLists);
      qc.setQueryData<TaskList[]>(qk.taskLists, (old) => old?.map((l) => (l.id === id ? { ...l, name } : l)));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(qk.taskLists, ctx?.prev);
      onError("Couldn’t rename that list.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.taskLists }),
  });

  const deleteList = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("task_lists").delete().eq("id", id); // tasks fall back to the Inbox (on delete set null)
      if (error) throw error;
    },
    onMutate: async (id) => {
      const snap = await snapshot();
      const prev = qc.getQueryData<TaskList[]>(qk.taskLists);
      qc.setQueryData<TaskList[]>(qk.taskLists, (old) => old?.filter((l) => l.id !== id));
      mapAll((all) => all.map((t) => (t.list_id === id ? { ...t, list_id: null } : t)));
      return { snap, prev };
    },
    onError: (_e, _v, ctx) => {
      rollback(ctx?.snap);
      qc.setQueryData(qk.taskLists, ctx?.prev);
      onError("Couldn’t delete that list.");
    },
    onSettled: () => {
      refresh();
      qc.invalidateQueries({ queryKey: qk.taskLists });
    },
  });

  // mutateAsync rejects on failure (after onError has shown the message); swallow it so callers can just `await`.
  const run = async <T>(p: Promise<T>): Promise<T | undefined> => {
    try {
      return await p;
    } catch {
      return undefined;
    }
  };

  return {
    patch: (id: string, changes: Partial<Task>) => run(patch.mutateAsync({ id, changes })),
    add: (d: Draft) => run(add.mutateAsync(d)),
    toggle: (t: Task) => run(toggle.mutateAsync(t)),
    remove: (ids: string[]) => run(remove.mutateAsync(ids)),
    reschedule: (ids: string[], date: string) => run(reschedule.mutateAsync({ ids, date })),
    archiveCompleted: () => run(archiveCompleted.mutateAsync()),
    addList: (name: string, color: string) => run(addList.mutateAsync({ name, color })),
    renameList: (id: string, name: string) => run(renameList.mutateAsync({ id, name })),
    deleteList: (id: string) => run(deleteList.mutateAsync(id)),
  };
}
