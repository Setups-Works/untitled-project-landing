"use client";

import { useMemo } from "react";
import { isoDate } from "../../../lib/dates";
import { fmtTime } from "../../../lib/prefs";
import type { CalendarEventItem } from "../types";
import type { Task } from "../../../lib/workspace";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck, faListCheck } from "@fortawesome/free-solid-svg-icons";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function WeekView({
  currentDate,
  events,
  tasks,
  showTasksLayer,
  weekStart,
  onSelectEvent,
  onNewEventOnSlot,
}: {
  currentDate: Date;
  events: CalendarEventItem[];
  tasks: Task[];
  showTasksLayer: boolean;
  weekStart: "mon" | "sun";
  onSelectEvent: (event: CalendarEventItem) => void;
  onNewEventOnSlot: (dateStr: string, timeStr: string) => void;
}) {
  const todayIso = isoDate(new Date());

  // Calculate 7 days of the week containing currentDate
  const weekDays = useMemo(() => {
    const cur = new Date(currentDate);
    const dayOfWeek = cur.getDay(); // 0 is Sun, 1 is Mon...
    const diff = (dayOfWeek - (weekStart === "sun" ? 0 : 1) + 7) % 7;

    const startOfWeek = new Date(cur);
    startOfWeek.setDate(cur.getDate() - diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        date: d,
        iso: isoDate(d),
        dayName: d.toLocaleDateString(undefined, { weekday: "short" }),
        dayNum: d.getDate(),
        isToday: isoDate(d) === todayIso,
      };
    });
  }, [currentDate, weekStart, todayIso]);

  // Split events into all-day vs timed per day
  const eventsByDay = useMemo(() => {
    const timed = new Map<string, CalendarEventItem[]>();
    const allDay = new Map<string, CalendarEventItem[]>();

    for (const ev of events) {
      const s = new Date(ev.start_at);
      const iso = isoDate(s);
      if (ev.all_day) {
        if (!allDay.has(iso)) allDay.set(iso, []);
        allDay.get(iso)!.push(ev);
      } else {
        if (!timed.has(iso)) timed.set(iso, []);
        timed.get(iso)!.push(ev);
      }
    }
    return { timed, allDay };
  }, [events]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    if (!showTasksLayer) return map;
    for (const t of tasks) {
      if (t.due_date) {
        if (!map.has(t.due_date)) map.set(t.due_date, []);
        map.get(t.due_date)!.push(t);
      }
    }
    return map;
  }, [tasks, showTasksLayer]);

  // Current time line calculation
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentMinutesOffset = currentHour * 60 + currentMinute;

  return (
    <div role="region" aria-label="Week view" className="flex flex-col rounded-r2 border border-line bg-surface shadow-e1 overflow-hidden">
      {/* Top Header: Days of the week */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-line bg-surface-muted/40">
        <div className="border-r border-line py-3 text-center text-[10px] font-medium text-fg-muted uppercase">Time</div>
        {weekDays.map((d) => (
          <div
            key={d.iso}
            className={`border-r border-line last:border-r-0 py-2.5 px-2 text-center ${d.isToday ? "bg-surface-accent/20" : ""}`}
          >
            <div className="text-[11px] font-medium text-fg-muted uppercase">{d.dayName}</div>
            <div
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold mt-0.5 ${
                d.isToday ? "bg-fg text-surface" : "text-fg"
              }`}
            >
              {d.dayNum}
            </div>
          </div>
        ))}
      </div>

      {/* All-Day Events row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-line bg-surface-muted/10 text-xs">
        <div className="border-r border-line p-2 text-right text-[10px] font-medium text-fg-muted self-center">All-day</div>
        {weekDays.map((d) => {
          const allDayEvs = eventsByDay.allDay.get(d.iso) || [];
          const dayTasks = tasksByDay.get(d.iso) || [];

          return (
            <div key={d.iso} className="border-r border-line last:border-r-0 p-1 min-h-[36px] flex flex-col gap-1 overflow-hidden">
              {allDayEvs.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className={`rounded-r1 px-1.5 py-0.5 text-left text-[11px] font-medium truncate at-${ev.color}`}
                >
                  {ev.title}
                </button>
              ))}
              {dayTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1 rounded-r1 bg-amber-bg/15 px-1.5 py-0.5 text-[11px] text-amber-fg truncate"
                >
                  <FA icon={t.done ? faCheck : faListCheck} className="text-[9px] shrink-0" />
                  <span className={`truncate ${t.done ? "line-through opacity-70" : ""}`}>{t.title}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Hourly Grid (Scrollable) */}
      <div className="max-h-[640px] overflow-y-auto">
        <div className="relative grid grid-cols-[60px_repeat(7,1fr)]">
          {/* Current time line if today is visible */}
          {weekDays.some((d) => d.isToday) && (
            <div
              className="pointer-events-none absolute left-[60px] right-0 z-20 flex items-center border-t-2 border-clay-fg"
              style={{
                top: `${(currentMinutesOffset / 60) * 48}px`, // 48px per hour
              }}
            >
              <span className="h-2 w-2 rounded-full bg-clay-fg -ml-1" />
            </div>
          )}

          {/* Time Labels Column */}
          <div className="border-r border-line bg-surface-muted/20 select-none">
            {HOURS.map((h) => (
              <div key={h} className="h-12 border-b border-line/60 pr-2 pt-0 text-right text-[10px] text-fg-muted">
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* 7 Days Hour Slots */}
          {weekDays.map((d) => {
            const dayEvents = eventsByDay.timed.get(d.iso) || [];

            return (
              <div key={d.iso} className={`relative border-r border-line last:border-r-0 ${d.isToday ? "bg-surface-accent/10" : ""}`}>
                {/* 24 hour slot rows for clicking */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    role="button"
                    tabIndex={0}
                    aria-label={`Add event on ${d.iso} at ${h}:00`}
                    onClick={() => onNewEventOnSlot(d.iso, `${String(h).padStart(2, "0")}:00`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onNewEventOnSlot(d.iso, `${String(h).padStart(2, "0")}:00`);
                      }
                    }}
                    className="h-12 border-b border-line/50 hover:bg-surface-sunken/60 focus:bg-surface-sunken focus:outline-none transition-colors"
                  />
                ))}

                {/* Timed Event Blocks overlay */}
                {dayEvents.map((ev) => {
                  const s = new Date(ev.start_at);
                  const e = new Date(ev.end_at);
                  const startMinutes = s.getHours() * 60 + s.getMinutes();
                  const durationMinutes = Math.max(30, Math.round((e.getTime() - s.getTime()) / 60000));

                  const top = (startMinutes / 60) * 48;
                  const height = Math.max(22, (durationMinutes / 60) * 48);

                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectEvent(ev);
                      }}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      className={`absolute left-0.5 right-0.5 z-10 overflow-hidden rounded-r1 p-1 text-left text-[11px] font-medium leading-tight shadow-e1 hover:opacity-90 at-${ev.color}`}
                    >
                      <div className="truncate font-semibold">{ev.title}</div>
                      <div className="text-[9px] opacity-80 truncate">
                        {fmtTime(ev.start_at)}
                        {ev.location && ` • ${ev.location}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
