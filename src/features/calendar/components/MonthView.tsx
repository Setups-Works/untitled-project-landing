"use client";

import { useMemo } from "react";
import { isoDate } from "../../../lib/dates";
import { fmtTime, weekdayLabels } from "../../../lib/prefs";
import type { CalendarEventItem } from "../types";
import type { Task } from "../../../lib/workspace";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck, faClock, faListCheck } from "@fortawesome/free-solid-svg-icons";

export default function MonthView({
  currentDate,
  events,
  tasks,
  showTasksLayer,
  weekStart,
  onSelectEvent,
  onNewEventOnDate,
}: {
  currentDate: Date;
  events: CalendarEventItem[];
  tasks: Task[];
  showTasksLayer: boolean;
  weekStart: "mon" | "sun";
  onSelectEvent: (event: CalendarEventItem) => void;
  onNewEventOnDate: (dateStr: string) => void;
}) {
  const todayIso = isoDate(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Column header labels
  const weekDayNames = useMemo(() => {
    return weekdayLabels("short", weekStart);
  }, [weekStart]);

  // Generate days in the month grid
  const days = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Day of week index (0-6) relative to weekStart
    const startDayIndex = (firstDayOfMonth.getDay() - (weekStart === "sun" ? 0 : 1) + 7) % 7;

    const list: {
      date: Date;
      iso: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Preceding month days
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      list.push({
        date: d,
        iso: isoDate(d),
        isCurrentMonth: false,
        isToday: isoDate(d) === todayIso,
      });
    }

    // Current month days
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const d = new Date(year, month, day);
      list.push({
        date: d,
        iso: isoDate(d),
        isCurrentMonth: true,
        isToday: isoDate(d) === todayIso,
      });
    }

    // Following month days to complete rows (multiples of 7)
    const remaining = 7 - (list.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        list.push({
          date: d,
          iso: isoDate(d),
          isCurrentMonth: false,
          isToday: isoDate(d) === todayIso,
        });
      }
    }

    return list;
  }, [year, month, weekStart, todayIso]);

  // Map events to date ISO strings
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const ev of events) {
      const start = new Date(ev.start_at);
      const end = new Date(ev.end_at);
      const startIso = isoDate(start);
      const endIso = isoDate(end);

      // Simple single-day or multi-day attachment
      if (startIso === endIso) {
        if (!map.has(startIso)) map.set(startIso, []);
        map.get(startIso)!.push(ev);
      } else {
        // Multi-day
        let cur = new Date(start);
        while (isoDate(cur) <= endIso) {
          const iso = isoDate(cur);
          if (!map.has(iso)) map.set(iso, []);
          map.get(iso)!.push(ev);
          cur.setDate(cur.getDate() + 1);
        }
      }
    }
    return map;
  }, [events]);

  // Map tasks to date ISO strings
  const tasksByDate = useMemo(() => {
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

  return (
    <div role="region" aria-label="Month view" className="overflow-hidden rounded-r2 border border-line bg-surface shadow-e1">
      {/* Day header row */}
      <div className="grid grid-cols-7 border-b border-line bg-surface-muted/40 text-center text-[11px] font-medium text-fg-muted">
        {weekDayNames.map((name, i) => (
          <div key={i} className="py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-line">
        {days.map((day) => {
          const dayEvents = eventsByDate.get(day.iso) || [];
          const dayTasks = tasksByDate.get(day.iso) || [];
          const totalItems = dayEvents.length + dayTasks.length;
          const displayLimit = 3;

          return (
            <div
              key={day.iso}
              tabIndex={0}
              role="gridcell"
              aria-label={`${day.date.toDateString()}, ${dayEvents.length} events, ${dayTasks.length} tasks`}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  onNewEventOnDate(day.iso);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onNewEventOnDate(day.iso);
                }
              }}
              className={`group relative flex min-h-[96px] sm:min-h-[110px] flex-col p-1.5 transition-colors focus:bg-surface-sunken focus:outline-none ${
                day.isCurrentMonth ? "bg-surface" : "bg-surface-muted/20 text-fg-muted"
              } ${day.isToday ? "bg-surface-accent/20" : ""}`}
            >
              {/* Day number & Quick add */}
              <div className="mb-1 flex items-center justify-between pointer-events-none">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                    day.isToday ? "bg-fg text-surface" : day.isCurrentMonth ? "text-fg" : "text-fg-faint"
                  }`}
                >
                  {day.date.getDate()}
                </span>

                <button
                  type="button"
                  aria-label={`Add event on ${day.iso}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewEventOnDate(day.iso);
                  }}
                  className="pointer-events-auto hidden text-[11px] text-fg-muted opacity-0 group-hover:opacity-100 sm:inline-block hover:text-fg"
                >
                  +
                </button>
              </div>

              {/* Items list */}
              <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                {/* Events */}
                {dayEvents.slice(0, displayLimit).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(ev);
                    }}
                    title={`${ev.title} (${ev.all_day ? "All day" : fmtTime(ev.start_at)})`}
                    className={`flex items-center gap-1 rounded-r1 px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight truncate transition-opacity hover:opacity-85 at-${ev.color}`}
                  >
                    {!ev.all_day && <span className="shrink-0 text-[9px] opacity-75">{fmtTime(ev.start_at)}</span>}
                    <span className="truncate">{ev.title}</span>
                  </button>
                ))}

                {/* Tasks */}
                {dayTasks.slice(0, Math.max(0, displayLimit - dayEvents.length)).map((t) => (
                  <div
                    key={t.id}
                    title={`Task: ${t.title} ${t.done ? "(Done)" : ""}`}
                    className="flex items-center gap-1 rounded-r1 bg-amber-bg/15 px-1.5 py-0.5 text-[11px] text-amber-fg truncate"
                  >
                    <FA icon={t.done ? faCheck : faListCheck} className="text-[9px] shrink-0" />
                    <span className={`truncate ${t.done ? "line-through opacity-70" : ""}`}>{t.title}</span>
                  </div>
                ))}

                {/* Overflow count */}
                {totalItems > displayLimit && (
                  <span className="text-[10px] font-medium text-fg-muted pl-1">+{totalItems - displayLimit} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
