"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "../../lib/api/client";
import { qk } from "../../lib/query/keys";
import type { CalendarEvent } from "../../lib/workspace";
import type { CalendarEventItem, EventDraft } from "./types";
import { draftToRow } from "./utils";

/**
 * Data layer for calendar events, on TanStack Query (same pattern as `features/tasks/queries.ts`). Reads are cached and refreshed by
 * realtime; writes update the cache first, roll back on error and refetch when settled. Components use these hooks, never `api()`.
 * Tasks with due dates come from `useTasks()` so the calendar and the To-do page always show the same data.
 * TODO(UNT-72): when the Google sync service lands, only the queryFn / mutationFn bodies change.
 */

const COLS = "id,external_id,calendar_id,title,description,location,start_at,end_at,all_day,color,created_at,updated_at";
const EMPTY: CalendarEventItem[] = [];

export function useCalendarEvents() {
  const sb = useMemo(api, []);
  const q = useQuery({
    queryKey: qk.calendar.events,
    queryFn: async () => {
      const { data, error } = await sb
        .from("calendar_events")
        .select<CalendarEvent>(COLS)
        .order("start_at", { ascending: true })
        .limit(5000);
      if (error) throw error;
      return data as CalendarEventItem[];
    },
  });
  return { ...q, events: q.data ?? EMPTY };
}

/** Create, update and delete. `onError` gets a friendly message; each action resolves to `true` when it worked. */
export function useCalendarActions(onError: (message: string) => void) {
  const sb = useMemo(api, []);
  const qc = useQueryClient();
  const key = qk.calendar.events;
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const snapshot = async () => {
    await qc.cancelQueries({ queryKey: key }); // so an in-flight refetch can't overwrite the optimistic change
    return qc.getQueryData<CalendarEventItem[]>(key);
  };

  const create = useMutation({
    mutationFn: async (d: EventDraft) => {
      const { error } = await sb.from("calendar_events").insert({ ...draftToRow(d), calendar_id: "primary" });
      if (error) throw error;
    },
    onError: () => onError("Couldn’t save that event."),
    onSettled: refresh,
  });

  const update = useMutation({
    mutationFn: async ({ id, draft }: { id: string; draft: EventDraft }) => {
      const { error } = await sb
        .from("calendar_events")
        .update({ ...draftToRow(draft), updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, draft }) => {
      const prev = await snapshot();
      qc.setQueryData<CalendarEventItem[]>(key, (old) => old?.map((e) => (e.id === id ? { ...e, ...draftToRow(draft) } : e)));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(key, ctx?.prev);
      onError("Couldn’t save that change.");
    },
    onSettled: refresh,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("calendar_events").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      const prev = await snapshot();
      qc.setQueryData<CalendarEventItem[]>(key, (old) => old?.filter((e) => e.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(key, ctx?.prev);
      onError("Couldn’t delete that event.");
    },
    onSettled: refresh,
  });

  return {
    save: async (draft: EventDraft, id?: string) => {
      try {
        if (id) await update.mutateAsync({ id, draft });
        else await create.mutateAsync(draft);
        return true;
      } catch {
        return false;
      }
    },
    remove: async (id: string) => {
      try {
        await remove.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
  };
}
