"use client";

import { useMemo } from "react";
import { dayLabel, isoDate } from "../../../lib/dates";
import { fmtTime } from "../../../lib/prefs";
import type { CalendarEventItem } from "../types";
import type { Task } from "../../../lib/workspace";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck, faClock, faLocationDot, faListCheck, faCalendarPlus } from "@fortawesome/free-solid-svg-icons";

export default function AgendaView({
  currentDate,
  events,
  tasks,
  showTasksLayer,
  onSelectEvent,
  onNewEventOnDate,
}: {
  currentDate: Date;
  events: CalendarEventItem[];
  tasks: Task[];
  showTasksLayer: boolean;
  onSelectEvent: (event: CalendarEventItem) => void;
  onNewEventOnDate: (dateStr: string) => void;
}) {
  const todayIso = isoDate(new Date());

  // Group events and tasks by date starting from currentDate for 28 days
  const agendaDays = useMemo(() => {
    const list: {
      iso: string;
      label: string;
      isToday: boolean;
      events: CalendarEventItem[];
      tasks: Task[];
    }[] = [];

    const start = new Date(currentDate);

    for (let i = 0; i < 28; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = isoDate(d);

      const dayEvents = events.filter((ev) => {
        const sIso = isoDate(new Date(ev.start_at));
        const eIso = isoDate(new Date(ev.end_at));
        return iso >= sIso && iso <= eIso;
      });

      const dayTasks = showTasksLayer ? tasks.filter((t) => t.due_date === iso) : [];

      if (dayEvents.length > 0 || dayTasks.length > 0 || i === 0) {
        list.push({
          iso,
          label: dayLabel(iso, todayIso),
          isToday: iso === todayIso,
          events: dayEvents,
          tasks: dayTasks,
        });
      }
    }

    return list;
  }, [currentDate, events, tasks, showTasksLayer, todayIso]);

  return (
    <div role="region" aria-label="Agenda view" className="space-y-4 rounded-r2 border border-line bg-surface p-3 sm:p-5 shadow-e1">
      {agendaDays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-fg-muted mb-3">
            <FA icon={faCalendarPlus} className="text-lg" />
          </div>
          <h3 className="text-sm font-medium text-fg">No upcoming events</h3>
          <p className="text-xs text-fg-muted mt-1 max-w-xs">
            No events scheduled for the next 4 weeks. Click "+ New event" or pick a date to create one.
          </p>
        </div>
      ) : (
        agendaDays.map((day) => (
          <div key={day.iso} className="space-y-2">
            {/* Day Header */}
            <div className="flex items-center justify-between border-b border-line pb-1.5 pt-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${day.isToday ? "text-fg" : "text-fg-muted"}`}>
                  {day.label}
                </span>
                <span className="text-[11px] text-fg-faint">{day.iso}</span>
                {day.isToday && <span className="rounded-pill bg-fg px-1.5 py-0.2 text-[9px] font-medium text-surface">Today</span>}
              </div>

              <button
                type="button"
                onClick={() => onNewEventOnDate(day.iso)}
                className="text-[11px] font-medium text-fg-muted hover:text-fg"
              >
                + Add
              </button>
            </div>

            {/* Empty items state for day 0 if no events */}
            {day.events.length === 0 && day.tasks.length === 0 && (
              <p className="text-xs text-fg-faint italic py-1 pl-2">No events or tasks</p>
            )}

            {/* Events list */}
            <div className="space-y-1.5">
              {day.events.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className={`w-full rounded-r1 p-2.5 text-left transition-transform hover:scale-[1.005] shadow-e1 at-${ev.color}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-semibold text-xs text-fg">{ev.title}</span>
                    <span className="flex items-center gap-1 text-[10px] opacity-80">
                      <FA icon={faClock} className="text-[9px]" />
                      <span>{ev.all_day ? "All day" : `${fmtTime(ev.start_at)} – ${fmtTime(ev.end_at)}`}</span>
                    </span>
                  </div>

                  {ev.location && (
                    <div className="flex items-center gap-1.5 text-[11px] opacity-85 mt-1">
                      <FA icon={faLocationDot} className="text-[9px]" />
                      <span>{ev.location}</span>
                    </div>
                  )}

                  {ev.description && <p className="text-[11px] opacity-75 mt-1 line-clamp-2">{ev.description}</p>}
                </button>
              ))}

              {/* Tasks */}
              {day.tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-r1 border border-amber-fg/20 bg-amber-bg/15 p-2 text-xs text-amber-fg"
                >
                  <div className="flex items-center gap-2">
                    <FA icon={t.done ? faCheck : faListCheck} className="text-xs shrink-0" />
                    <span className={t.done ? "line-through opacity-70" : "font-medium"}>{t.title}</span>
                  </div>
                  <span className="text-[10px] opacity-75 uppercase">Task</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
