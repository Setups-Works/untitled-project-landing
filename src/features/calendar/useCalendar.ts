"use client";

import { useCallback, useMemo, useState } from "react";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate";
import { isoDate } from "../../lib/dates";
import { qk } from "../../lib/query/keys";
import { readPrefs } from "../../lib/prefs";
import { useTasks } from "../tasks/queries";
import { useCalendarActions, useCalendarEvents } from "./queries";
import type { CalendarEventItem, CalendarViewMode, EventDraft } from "./types";
import { groupEventsByDay, groupTasksByDay, shiftDate } from "./utils";

export type Slot = { date: string; time?: string };

/** View state (period, mode, dialog) on top of the query hooks. Rendered only in the browser, so reading `window` here is safe. */
export function useCalendar(onError: (message: string) => void) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  // Phones start on the agenda: a seven-column grid is unreadable at 375 px.
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => (window.innerWidth < 640 ? "agenda" : "month"));
  const [showTasks, setShowTasks] = useState(true);
  const [editing, setEditing] = useState<CalendarEventItem | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const prefs = useMemo(readPrefs, []);

  const { events, isLoading: loadingEvents } = useCalendarEvents();
  const { tasks, isLoading: loadingTasks } = useTasks();
  useRealtimeInvalidate("calendar_events", [qk.calendar.all]);
  useRealtimeInvalidate("tasks", [qk.tasks.all]);
  const actions = useCalendarActions(onError);

  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);
  const tasksByDay = useMemo(() => (showTasks ? groupTasksByDay(tasks) : new Map()), [tasks, showTasks]);

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);
  const goPrev = useCallback(() => setCurrentDate((d) => shiftDate(d, viewMode, -1)), [viewMode]);
  const goNext = useCallback(() => setCurrentDate((d) => shiftDate(d, viewMode, 1)), [viewMode]);
  const openDay = useCallback((iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    setCurrentDate(new Date(y, m - 1, d));
    setViewMode("day");
  }, []);

  const dialogOpen = editing !== null || slot !== null;
  const newEvent = useCallback((date?: string, time?: string) => setSlot({ date: date ?? isoDate(), time }), []);
  const editEvent = useCallback((ev: CalendarEventItem) => setEditing(ev), []);
  const closeDialog = useCallback(() => {
    setEditing(null);
    setSlot(null);
  }, []);

  const save = useCallback((draft: EventDraft) => actions.save(draft, editing?.id), [actions, editing]);

  return {
    currentDate,
    viewMode,
    setViewMode,
    showTasks,
    setShowTasks,
    prefs,
    loading: loadingEvents || loadingTasks,
    eventsByDay,
    tasksByDay,
    goToToday,
    goPrev,
    goNext,
    openDay,
    dialogOpen,
    editing,
    slot,
    newEvent,
    editEvent,
    closeDialog,
    save,
    remove: actions.remove,
  };
}
