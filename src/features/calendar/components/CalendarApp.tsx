"use client";

import { useEffect, useState } from "react";
import { useConfirm } from "../../../components/ui/Confirm";
import { weekDays as weekOf } from "../utils";
import { isoDate } from "../../../lib/dates";
import { useCalendar } from "../useCalendar";
import { eventToDraft, newDraft, titleFor } from "../utils";
import AgendaView from "./AgendaView";
import CalendarHeader from "./CalendarHeader";
import ConnectCalendarBanner from "./ConnectCalendarBanner";
import EventDialog from "./EventDialog";
import MonthView from "./MonthView";
import TimeGrid from "./TimeGrid";

export default function CalendarApp() {
  const [err, setErr] = useState("");
  const { ask, dialog: confirmDialog } = useConfirm();
  const c = useCalendar(setErr);
  const { viewMode, setViewMode, goToToday, goPrev, goNext, newEvent, dialogOpen } = c;

  // Single-key shortcuts, ignored while typing or while a dialog is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (dialogOpen || e.metaKey || e.ctrlKey || e.altKey || t?.closest("input,textarea,select,[contenteditable=true]")) return;
      const views: Record<string, "month" | "week" | "day" | "agenda"> = { m: "month", w: "week", d: "day", a: "agenda" };
      const k = e.key.toLowerCase();
      if (views[k]) setViewMode(views[k]);
      else if (k === "t") goToToday();
      else if (k === "c" || k === "n") {
        e.preventDefault();
        newEvent();
      } else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dialogOpen, setViewMode, goToToday, goPrev, goNext, newEvent]);

  const removeEvent = async () => {
    if (!c.editing) return;
    const yes = await ask({
      title: "Delete this event?",
      body: <>“{c.editing.title}” will be permanently deleted. This can’t be undone.</>,
      confirmLabel: "Delete event",
      danger: true,
    });
    if (!yes) return;
    if (await c.remove(c.editing.id)) c.closeDialog();
  };

  const week = weekOf(c.currentDate, c.prefs.weekStart);
  return (
    <div className="mx-auto w-full max-w-[1120px]">
      {confirmDialog}
      <ConnectCalendarBanner />
      <CalendarHeader
        title={titleFor(c.currentDate, viewMode, c.prefs.weekStart)}
        viewMode={viewMode}
        showTasks={c.showTasks}
        onViewChange={setViewMode}
        onToggleTasks={() => c.setShowTasks(!c.showTasks)}
        onToday={goToToday}
        onPrev={goPrev}
        onNext={goNext}
        onNewEvent={() => newEvent()}
      />
      {err && (
        <p className="form-err mb-3" role="alert">
          {err}
        </p>
      )}

      {c.loading ? (
        <p className="ap-none">Loading your calendar…</p>
      ) : viewMode === "month" ? (
        <MonthView
          currentDate={c.currentDate}
          eventsByDay={c.eventsByDay}
          tasksByDay={c.tasksByDay}
          weekStart={c.prefs.weekStart}
          onOpenEvent={c.editEvent}
          onNewOn={(iso) => newEvent(iso)}
          onOpenDay={c.openDay}
        />
      ) : viewMode === "week" ? (
        <TimeGrid
          label="Week view"
          days={week}
          eventsByDay={c.eventsByDay}
          tasksByDay={c.tasksByDay}
          onOpenEvent={c.editEvent}
          onNewAt={newEvent}
          onOpenDay={c.openDay}
        />
      ) : viewMode === "day" ? (
        <TimeGrid
          label="Day view"
          days={[c.currentDate]}
          eventsByDay={c.eventsByDay}
          tasksByDay={c.tasksByDay}
          onOpenEvent={c.editEvent}
          onNewAt={newEvent}
        />
      ) : (
        <AgendaView
          currentDate={c.currentDate}
          eventsByDay={c.eventsByDay}
          tasksByDay={c.tasksByDay}
          onOpenEvent={c.editEvent}
          onNewOn={(iso) => newEvent(iso)}
        />
      )}

      {c.dialogOpen && (
        <EventDialog
          initial={c.editing ? eventToDraft(c.editing) : newDraft(c.slot?.date ?? isoDate(), c.slot?.time)}
          editing={!!c.editing}
          onSave={(d) => {
            setErr("");
            return c.save(d);
          }}
          onDelete={removeEvent}
          onClose={c.closeDialog}
        />
      )}
    </div>
  );
}
