import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Draft } from "@untitled/logic";
import { firstDue, nextDue } from "@untitled/logic";
import type { ItemResponse, Task, TaskList } from "@untitled/types";

import { dbQuery } from "@/features/chat/db";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Same reads the web makes: the generic /api/v1/db door for lists of everything, the REST endpoints for writes.
const TASK_COLS = "id,title,description,priority,list_id,due_date,done,done_at,cancelled,archived,recurrence,created_at";
const LIST_COLS = "id,name,color,created_at";
const listsKey = ["task-lists"] as const;

export function useTasks() {
  return useQuery({
    queryKey: qk.tasks,
    queryFn: async () =>
      (await dbQuery<Task[]>({
        table: "tasks",
        op: "select",
        columns: TASK_COLS,
        order: [{ column: "created_at", ascending: true }],
        limit: 5000,
      })) ?? [],
  });
}

export function useTaskLists() {
  return useQuery({
    queryKey: listsKey,
    queryFn: async () =>
      (await dbQuery<TaskList[]>({
        table: "task_lists",
        op: "select",
        columns: LIST_COLS,
        order: [{ column: "created_at", ascending: true }],
      })) ?? [],
  });
}

type Changes = Partial<
  Pick<Task, "title" | "description" | "priority" | "list_id" | "due_date" | "recurrence" | "done" | "done_at" | "cancelled" | "archived">
>;

/** All task writes. Each updates the cached list at once (so Home and To-do agree) and rolls back if the server refuses. */
export function useTaskActions(today: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: qk.tasks });
  const mapAll = (fn: (all: Task[]) => Task[]) => qc.setQueryData<Task[]>(qk.tasks, (old) => (old ? fn(old) : old));
  const snapshot = async () => {
    await qc.cancelQueries({ queryKey: qk.tasks });
    return qc.getQueryData<Task[]>(qk.tasks);
  };
  const rollback = (_e: unknown, _v: unknown, ctx?: { before?: Task[] }) => {
    if (ctx?.before) qc.setQueryData(qk.tasks, ctx.before);
  };

  const patch = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Changes }) => api.patch<ItemResponse<Task>>(`/api/v1/tasks/${id}`, changes),
    onMutate: async ({ id, changes }) => {
      const before = await snapshot();
      mapAll((all) => all.map((t) => (t.id === id ? { ...t, ...changes } : t)));
      return { before };
    },
    onError: rollback,
    onSettled: refresh,
  });

  const add = useMutation({
    mutationFn: (d: Draft) =>
      api.post<ItemResponse<Task>>("/api/v1/tasks", {
        title: d.title,
        description: d.description,
        due_date: firstDue(d.due_date, d.recurrence, today),
        priority: d.priority,
        list_id: d.list_id,
        recurrence: d.recurrence,
      }),
    onSettled: refresh,
  });

  /** Complete / un-complete. Completing a repeating task also schedules its next occurrence, exactly as the web does. */
  const toggle = useMutation({
    mutationFn: async (t: Task) => {
      const done = !t.done;
      await api.patch(`/api/v1/tasks/${t.id}`, { done, done_at: done ? new Date().toISOString() : null });
      if (done && t.recurrence && t.due_date) {
        await api.post("/api/v1/tasks", {
          title: t.title,
          description: t.description,
          due_date: nextDue(t.due_date, t.recurrence, today),
          priority: t.priority,
          list_id: t.list_id,
          recurrence: t.recurrence,
        });
      }
    },
    onMutate: async (t) => {
      const before = await snapshot();
      mapAll((all) => all.map((x) => (x.id === t.id ? { ...x, done: !t.done, done_at: !t.done ? new Date().toISOString() : null } : x)));
      return { before };
    },
    onError: rollback,
    onSettled: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: true }>(`/api/v1/tasks/${id}`),
    onMutate: async (id) => {
      const before = await snapshot();
      mapAll((all) => all.filter((t) => t.id !== id));
      return { before };
    },
    onError: rollback,
    onSettled: refresh,
  });

  const archiveCompleted = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.patch(`/api/v1/tasks/${id}`, { archived: true })));
    },
    onSettled: refresh,
  });

  return { patch, add, toggle, remove, archiveCompleted };
}

export function useListActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: listsKey });
  const add = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      dbQuery<TaskList>({ table: "task_lists", op: "insert", values: { name, color }, returning: LIST_COLS, single: "single" }),
    onSettled: refresh,
  });
  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      dbQuery({ table: "task_lists", op: "update", values: { name }, filters: [{ column: "id", op: "eq", value: id }] }),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => dbQuery({ table: "task_lists", op: "delete", filters: [{ column: "id", op: "eq", value: id }] }),
    onSettled: () => {
      void refresh();
      void qc.invalidateQueries({ queryKey: qk.tasks });
    },
  });
  return { add, rename, remove };
}
