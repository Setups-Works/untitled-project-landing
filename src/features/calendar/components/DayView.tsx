"use client";

import { useMemo } from "react";
import { isoDate } from "../../../lib/dates";
import { fmtTime } from "../../../lib/prefs";
import type { CalendarEventItem } from "../types";
import type { Task } from "../../../lib/workspace";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck, faListCheck, faLocationDot, faAlignLeft } from "@fortawesome/free-solid-svg-icons";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DayView({
  currentDate,
  events,
  tasks,
  showTasksLayer,
  onSelectEvent,
  onNewEventOnSlot,
}: {
  currentDate: Date;
  events: CalendarEventItem[];
  tasks: Task[];
  showTasksLayer: boolean;
  onSelectEvent: (event: CalendarEventItem) => void;
  onNewEventOnSlot: (dateStr: string, timeStr: string) => void;
}) {
  const currentIso = isoDate(currentDate);
  const isToday = currentIso === isoDate(new Date());

  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay: CalendarEventItem[] = [];
    const timed: CalendarEventItem[] = [];

    for (const ev of events) {
      const s = new Date(ev.start_at);
      const e = new Date(ev.end_at);
      const startIso = isoDate(s);
      const endIso = isoDate(e);

      if (currentIso >= startIso && currentIso <= endIso) {
        if (ev.all_day) {
          allDay.push(ev);
        } else {
          timed.push(ev);
        }
      }
    }
    return { allDayEvents: allDay, timedEvents: timed };
  }, [events, currentIso]);

  const tasksDueToday = useMemo(() => {
    if (!showTasksLayer) return [];
    return tasks.filter((t) => t.due_date === currentIso);
  }, [tasks, showTasksLayer, currentIso]);

  // Current time offset
  const now = new Date();
  const currentMinutesOffset = now.getHours() * 60 + now.getMinutes();

  return (
    <div role="region" aria-label="Day view" className="flex flex-col rounded-r2 border border-line bg-surface shadow-e1 overflow-hidden">
      {/* Day header banner */}
      <div className="flex items-center justify-between border-b border-line bg-surface-muted/40 p-4">
        <div>
          <h2 className="text-lg font-serif text-fg">
            {currentDate.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h2>
          {isToday && (
            <span className="inline-block mt-0.5 rounded-pill bg-fg px-2 py-0.5 text-[10px] font-medium text-surface">Today</span>
          )}
        </div>
        <div className="text-xs text-fg-muted">
          {timedEvents.length + allDayEvents.length} event(s)
          {showTasksLayer && ` • ${tasksDueToday.length} task(s)`}
        </div>
      </div>

      {/* All-day items & tasks section */}
      {(allDayEvents.length > 0 || tasksDueToday.length > 0) && (
        <div className="border-b border-line bg-surface-muted/10 p-3 space-y-2">
          {allDayEvents.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-fg-muted">All-day:</span>
              {allDayEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className={`rounded-r1 px-2.5 py-1 text-xs font-medium at-${ev.color}`}
                >
                  {ev.title}
                </button>
              ))}
            </div>
          )}

          {tasksDueToday.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-amber-fg">Tasks due:</span>
              {tasksDueToday.map((t) => (
                <div key={t.id} className="flex items-center gap-1.5 rounded-r1 bg-amber-bg/15 px-2 py-0.5 text-xs text-amber-fg">
                  <FA icon={t.done ? faCheck : faListCheck} className="text-[10px]" />
                  <span className={t.done ? "line-through opacity-70" : ""}>{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hourly Schedule */}
      <div className="max-h-[640px] overflow-y-auto">
        <div className="relative grid grid-cols-[70px_1fr]">
          {/* Current time indicator line */}
          {isToday && (
            <div
              className="pointer-events-none absolute left-[70px] right-0 z-20 flex items-center border-t-2 border-clay-fg"
              style={{
                top: `${(currentMinutesOffset / 60) * 56}px`, // 56px per hour
              }}
            >
              <span className="h-2 w-2 rounded-full bg-clay-fg -ml-1" />
            </div>
          )}

          {/* Time column */}
          <div className="border-r border-line bg-surface-muted/20 select-none">
            {HOURS.map((h) => (
              <div key={h} className="h-14 border-b border-line/60 pr-2 pt-1 text-right text-xs text-fg-muted">
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Slots & Events area */}
          <div className="relative">
            {HOURS.map((h) => (
              <div
                key={h}
                role="button"
                tabIndex={0}
                aria-label={`Add event at ${h}:00`}
                onClick={() => onNewEventOnSlot(currentIso, `${String(h).padStart(2, "0")}:00`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onNewEventOnSlot(currentIso, `${String(h).padStart(2, "0")}:00`);
                  }
                }}
                className="h-14 border-b border-line/50 hover:bg-surface-sunken/60 focus:bg-surface-sunken focus:outline-none transition-colors"
              />
            ))}

            {/* Event blocks */}
            {timedEvents.map((ev) => {
              const s = new Date(ev.start_at);
              const e = new Date(ev.end_at);
              const startMinutes = s.getHours() * 60 + s.getMinutes();
              const durationMinutes = Math.max(30, Math.round((e.getTime() - s.getTime()) / 60000));

              const top = (startMinutes / 60) * 56;
              const height = Math.max(32, (durationMinutes / 60) * 56);

              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(ev);
                  }}
                  style={{ top: `${top}px`, height: `${height}px` }}
                  className={`absolute left-2 right-2 z-10 overflow-hidden rounded-r1 p-2 text-left shadow-e1 hover:opacity-95 at-${ev.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs truncate">{ev.title}</span>
                    <span className="text-[10px] opacity-80 shrink-0">
                      {fmtTime(ev.start_at)} – {fmtTime(ev.end_at)}
                    </span>
                  </div>

                  {ev.location && (
                    <div className="flex items-center gap-1 text-[11px] opacity-85 mt-0.5 truncate">
                      <FA icon={faLocationDot} className="text-[9px]" />
                      <span>{ev.location}</span>
                    </div>
                  )}

                  {ev.description && <p className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{ev.description}</p>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
