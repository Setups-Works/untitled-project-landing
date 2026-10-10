"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api/client";
import { isoDate } from "../../lib/dates";
import { readPrefs } from "../../lib/prefs";
import type { CalendarEvent, Task } from "../../lib/workspace";
import type { CalendarEventItem, CalendarViewMode, EventDraft } from "./types";

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [showTasksLayer, setShowTasksLayer] = useState<boolean>(true);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventItem | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<{ date: string; time?: string } | null>(null);

  const prefs = useMemo(() => readPrefs(), []);

  // Fetch events and tasks
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, tasksRes] = await Promise.all([
        api()
          .from("calendar_events")
          .select<CalendarEvent>(
            "id,external_id,calendar_id,title,description,location,start_at,end_at,all_day,color,created_at,updated_at",
          )
          .order("start_at", { ascending: true }),
        api()
          .from("tasks")
          .select<Task>("id,title,description,priority,list_id,due_date,done,done_at,cancelled,archived,recurrence,created_at")
          .eq("archived", false)
          .eq("cancelled", false)
          .not("due_date", "is", null),
      ]);

      if (eventsRes.data) {
        setEvents(eventsRes.data as CalendarEventItem[]);
      }
      if (tasksRes.data) {
        setTasks(tasksRes.data as Task[]);
      }
    } catch (err) {
      console.error("Failed to load calendar data:", err);
      setError("Unable to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Navigate functions
  const goToToday = useCallback(() => setCurrentDate(new Date()), []);

  const goToPrev = useCallback(() => {
    setCurrentDate((d) => {
      const next = new Date(d);
      if (viewMode === "month") {
        next.setMonth(next.getMonth() - 1);
      } else if (viewMode === "week") {
        next.setDate(next.getDate() - 7);
      } else if (viewMode === "day") {
        next.setDate(next.getDate() - 1);
      } else {
        // agenda
        next.setDate(next.getDate() - 14);
      }
      return next;
    });
  }, [viewMode]);

  const goToNext = useCallback(() => {
    setCurrentDate((d) => {
      const next = new Date(d);
      if (viewMode === "month") {
        next.setMonth(next.getMonth() + 1);
      } else if (viewMode === "week") {
        next.setDate(next.getDate() + 7);
      } else if (viewMode === "day") {
        next.setDate(next.getDate() + 1);
      } else {
        // agenda
        next.setDate(next.getDate() + 14);
      }
      return next;
    });
  }, [viewMode]);

  // Event modal actions
  const openNewEvent = useCallback((dateStr?: string, timeStr?: string) => {
    setEditingEvent(null);
    setDefaultSlot({
      date: dateStr || isoDate(new Date()),
      time: timeStr || "09:00",
    });
    setDialogOpen(true);
  }, []);

  const openEditEvent = useCallback((event: CalendarEventItem) => {
    setEditingEvent(event);
    setDefaultSlot(null);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingEvent(null);
    setDefaultSlot(null);
  }, []);

  // CRUD
  const saveEvent = useCallback(
    async (draft: EventDraft) => {
      let startIso: string;
      let endIso: string;

      if (draft.all_day) {
        startIso = new Date(`${draft.start_date}T00:00:00`).toISOString();
        endIso = new Date(`${draft.end_date}T23:59:59`).toISOString();
      } else {
        startIso = new Date(`${draft.start_date}T${draft.start_time || "09:00"}:00`).toISOString();
        endIso = new Date(`${draft.end_date}T${draft.end_time || "10:00"}:00`).toISOString();
      }

      if (editingEvent) {
        // Update
        const { data, error } = (await api().from("calendar_events").eq("id", editingEvent.id).update({
          title: draft.title,
          description: draft.description,
          location: draft.location,
          start_at: startIso,
          end_at: endIso,
          all_day: draft.all_day,
          color: draft.color,
          updated_at: new Date().toISOString(),
        })) as { data: CalendarEvent[] | null; error: { message: string } | null };

        if (!error) {
          setEvents((prev) =>
            prev.map((ev) =>
              ev.id === editingEvent.id
                ? {
                    ...ev,
                    title: draft.title,
                    description: draft.description,
                    location: draft.location,
                    start_at: startIso,
                    end_at: endIso,
                    all_day: draft.all_day,
                    color: draft.color,
                    updated_at: new Date().toISOString(),
                  }
                : ev,
            ),
          );
          closeDialog();
        } else {
          throw new Error(error.message);
        }
      } else {
        // Create
        const { data, error } = (await api().from("calendar_events").insert({
          title: draft.title,
          description: draft.description,
          location: draft.location,
          start_at: startIso,
          end_at: endIso,
          all_day: draft.all_day,
          color: draft.color,
          calendar_id: "primary",
        })) as { data: CalendarEvent[] | null; error: { message: string } | null };

        if (!error) {
          await loadData();
          closeDialog();
        } else {
          throw new Error(error.message);
        }
      }
    },
    [editingEvent, closeDialog, loadData],
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const { error } = (await api().from("calendar_events").eq("id", id).delete()) as {
        data: unknown;
        error: { message: string } | null;
      };

      if (!error) {
        setEvents((prev) => prev.filter((ev) => ev.id !== id));
        closeDialog();
      } else {
        throw new Error(error.message);
      }
    },
    [closeDialog],
  );

  return {
    currentDate,
    setCurrentDate,
    viewMode,
    setViewMode,
    showTasksLayer,
    setShowTasksLayer,
    events,
    tasks,
    loading,
    error,
    prefs,
    goToToday,
    goToPrev,
    goToNext,
    dialogOpen,
    editingEvent,
    defaultSlot,
    openNewEvent,
    openEditEvent,
    closeDialog,
    saveEvent,
    deleteEvent,
    refresh: loadData,
  };
}
