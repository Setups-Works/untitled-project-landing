"use client";

import { isoDate } from "../../../lib/dates";
import { weekdayLabels } from "../../../lib/prefs";
import type { Task } from "../../../lib/workspace";
import type { CalendarEventItem } from "../types";
import { monthCells } from "../utils";
import { EventChip, TaskChip } from "./Chips";

const LIMIT = 3;

export default function MonthView({
  currentDate,
  eventsByDay,
  tasksByDay,
  weekStart,
  onOpenEvent,
  onNewOn,
  onOpenDay,
}: {
  currentDate: Date;
  eventsByDay: Map<string, CalendarEventItem[]>;
  tasksByDay: Map<string, Task[]>;
  weekStart: "mon" | "sun";
  onOpenEvent: (ev: CalendarEventItem) => void;
  onNewOn: (iso: string) => void;
  onOpenDay: (iso: string) => void;
}) {
  const today = isoDate();
  const cells = monthCells(currentDate, weekStart);

  return (
    <section aria-label="Month view" className="glass overflow-hidden rounded-r3">
      <div className="mx-3 mt-3 mb-3.5 grid grid-cols-7 gap-px overflow-hidden rounded-r2 bg-line max-sm:mx-2 max-sm:mb-2.5">
        {weekdayLabels("short", weekStart).map((d) => (
          <span key={d} className="bg-white/70 p-2 text-center text-[12px] text-fg-subtle">
            {d}
          </span>
        ))}
        {cells.map((d) => {
          const iso = isoDate(d);
          const events = eventsByDay.get(iso) ?? [];
          const tasks = tasksByDay.get(iso) ?? [];
          const items = events.length + tasks.length;
          const out = d.getMonth() !== currentDate.getMonth();
          const isToday = iso === today;
          const shownTasks = tasks.slice(0, Math.max(0, LIMIT - events.length));
          return (
            <div
              key={iso}
              className={`flex min-h-[104px] min-w-0 flex-col gap-[3px] p-1.5 max-[900px]:min-h-[70px] max-[900px]:p-1 ${isToday ? "bg-white" : out ? "bg-white/30" : "bg-white/60"}`}
            >
              <button
                type="button"
                aria-label={`Add event on ${d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}`}
                aria-current={isToday ? "date" : undefined}
                onClick={() => onNewOn(iso)}
                className={`h-[26px] min-w-[26px] self-start rounded-pill px-1.5 text-[12.5px] transition-colors ${
                  isToday ? "bg-fg text-on-dark" : `${out ? "text-fg-faint" : "text-fg-muted"} hover:bg-surface-sunken`
                }`}
              >
                {d.getDate()}
              </button>
              {events.slice(0, LIMIT).map((ev) => (
                <EventChip key={ev.id} ev={ev} onOpen={onOpenEvent} />
              ))}
              {shownTasks.map((t) => (
                <TaskChip key={t.id} task={t} />
              ))}
              {items > LIMIT && (
                <button type="button" onClick={() => onOpenDay(iso)} className="self-start pl-1 text-[11.5px] text-fg-subtle hover:text-fg">
                  +{items - LIMIT} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
