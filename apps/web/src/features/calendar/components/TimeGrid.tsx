"use client";

import { useEffect, useMemo, useRef, type MouseEvent } from "react";
import { isoDate } from "../../../lib/dates";
import type { Task } from "../../../lib/workspace";
import type { CalendarEventItem } from "../types";
import { HOUR_PX, hhmm, layoutDay, timeLabel, toneOf } from "../utils";
import { EventChip, TaskChip } from "./Chips";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const GUTTER = "grid-cols-[52px_repeat(var(--n),minmax(0,1fr))]";

/**
 * Hour grid for the Week (7 days) and Day (1 day) views. Clicking an empty slot starts a new event at that hour; keyboard users have
 * the "New event" button and the `c` shortcut, so the 24 slots per day are not tab stops.
 */
export default function TimeGrid({
  label,
  days,
  eventsByDay,
  tasksByDay,
  onOpenEvent,
  onNewAt,
  onOpenDay,
}: {
  label: string;
  days: Date[];
  eventsByDay: Map<string, CalendarEventItem[]>;
  tasksByDay: Map<string, Task[]>;
  onOpenEvent: (ev: CalendarEventItem) => void;
  onNewAt: (iso: string, time: string) => void;
  onOpenDay?: (iso: string) => void;
}) {
  const today = isoDate();
  const scroller = useRef<HTMLDivElement>(null);
  const now = new Date();
  const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_PX;
  const style = { "--n": days.length } as React.CSSProperties;

  // Open on the working day rather than midnight.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 7 * HOUR_PX });
  }, []);

  const placed = useMemo(
    () => new Map(days.map((d) => [isoDate(d), layoutDay(eventsByDay.get(isoDate(d)) ?? [], isoDate(d))])),
    [days, eventsByDay],
  );

  const slotClick = (iso: string) => (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const half = Math.floor((y / HOUR_PX) * 2) / 2;
    const h = Math.floor(half);
    onNewAt(iso, `${String(h).padStart(2, "0")}:${half % 1 ? "30" : "00"}`);
  };

  return (
    <section aria-label={label} className="glass overflow-hidden rounded-r3">
      <div className="overflow-x-auto">
        <div className="min-w-[640px] max-sm:min-w-[560px]" style={style}>
          {/* Day headings */}
          <div className={`grid ${GUTTER} border-b border-line bg-white/70`}>
            <span />
            {days.map((d) => {
              const iso = isoDate(d);
              const isToday = iso === today;
              const heading = (
                <>
                  <span className="block text-[12px] text-fg-subtle">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
                  <span
                    className={`mt-0.5 inline-grid h-8 min-w-8 place-items-center rounded-pill px-1 text-[15px] ${isToday ? "bg-fg text-on-dark" : "text-fg"}`}
                  >
                    {d.getDate()}
                  </span>
                </>
              );
              return (
                <div key={iso} className="py-2 text-center">
                  {onOpenDay ? (
                    <button
                      type="button"
                      onClick={() => onOpenDay(iso)}
                      aria-label={`Open ${d.toDateString()}`}
                      className="rounded-r1 px-2 hover:bg-surface-sunken"
                    >
                      {heading}
                    </button>
                  ) : (
                    heading
                  )}
                </div>
              );
            })}
          </div>

          {/* All-day events and tasks */}
          <div className={`grid ${GUTTER} border-b border-line bg-white/50`}>
            <span className="self-center pr-2 text-right text-[11px] text-fg-faint">all day</span>
            {days.map((d) => {
              const iso = isoDate(d);
              const allDay = (eventsByDay.get(iso) ?? []).filter((e) => e.all_day);
              const tasks = tasksByDay.get(iso) ?? [];
              return (
                <div key={iso} className="flex min-h-[38px] min-w-0 flex-col gap-[3px] border-l border-line p-1">
                  {allDay.map((ev) => (
                    <EventChip key={ev.id} ev={ev} onOpen={onOpenEvent} showTime={false} />
                  ))}
                  {tasks.map((t) => (
                    <TaskChip key={t.id} task={t} />
                  ))}
                </div>
              );
            })}
          </div>

          {/* Hours */}
          <div ref={scroller} className="max-h-[min(640px,70vh)] overflow-y-auto">
            <div className={`relative grid ${GUTTER}`} style={{ height: HOUR_PX * 24 }}>
              <div className="select-none" aria-hidden>
                {HOURS.map((h) => (
                  <div key={h} className="pr-2 text-right text-[11px] text-fg-faint" style={{ height: HOUR_PX }}>
                    {h > 0 && <span className="relative -top-[7px]">{timeLabel(`${h}:00`, true)}</span>}
                  </div>
                ))}
              </div>
              {days.map((d) => {
                const iso = isoDate(d);
                return (
                  <div
                    key={iso}
                    onClick={slotClick(iso)}
                    className={`relative cursor-pointer border-l border-line bg-[repeating-linear-gradient(to_bottom,transparent,transparent_calc(var(--h)_-_1px),var(--line)_calc(var(--h)_-_1px),var(--line)_var(--h))] ${iso === today ? "bg-white/60" : ""}`}
                    style={{ "--h": `${HOUR_PX}px` } as React.CSSProperties}
                  >
                    {placed.get(iso)?.map(({ ev, top, height, col, cols }) => (
                      <button
                        key={`${ev.id}-${iso}`}
                        type="button"
                        onClick={() => onOpenEvent(ev)}
                        style={{ top, height, left: `calc(${(col / cols) * 100}% + 2px)`, width: `calc(${100 / cols}% - 4px)` }}
                        className={`at-${toneOf(ev.color)} tint absolute z-10 overflow-hidden rounded-[9px] px-2 py-1 text-left text-[12px] leading-tight transition-[filter] hover:brightness-95`}
                      >
                        <span className="block truncate font-medium">{ev.title}</span>
                        {height > 34 && (
                          <span className="block truncate text-[11px] opacity-75">
                            {timeLabel(hhmm(new Date(ev.start_at)), true)}
                            {ev.location && ` · ${ev.location}`}
                          </span>
                        )}
                      </button>
                    ))}
                    {iso === today && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute right-0 left-0 z-20 h-0.5 bg-clay-fg"
                        style={{ top: nowTop }}
                      >
                        <i className="absolute -top-[3px] -left-1 size-2 rounded-full bg-clay-fg" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
