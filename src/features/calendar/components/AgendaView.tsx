"use client";

import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faLocationDot, faPlus } from "@fortawesome/free-solid-svg-icons";
import { addDays, dayLabel, isoDate } from "../../../lib/dates";
import type { Task } from "../../../lib/workspace";
import type { CalendarEventItem } from "../types";
import { AGENDA_DAYS, hhmm, timeLabel, toneOf } from "../utils";
import { TaskChip } from "./Chips";

/** The next four weeks as a list: only days with something on them, plus the first day so there is always a place to add. */
export default function AgendaView({
  currentDate,
  eventsByDay,
  tasksByDay,
  onOpenEvent,
  onNewOn,
}: {
  currentDate: Date;
  eventsByDay: Map<string, CalendarEventItem[]>;
  tasksByDay: Map<string, Task[]>;
  onOpenEvent: (ev: CalendarEventItem) => void;
  onNewOn: (iso: string) => void;
}) {
  const today = isoDate();
  const first = isoDate(currentDate);
  const days = Array.from({ length: AGENDA_DAYS }, (_, i) => addDays(first, i)).filter(
    (iso, i) => i === 0 || eventsByDay.has(iso) || tasksByDay.has(iso),
  );
  const empty = days.length === 1 && !eventsByDay.has(first) && !tasksByDay.has(first);

  return (
    <section aria-label="Agenda" className="glass overflow-hidden rounded-r3 pb-2">
      {days.map((iso) => {
        const events = eventsByDay.get(iso) ?? [];
        const tasks = tasksByDay.get(iso) ?? [];
        return (
          <div key={iso}>
            <h2 className="flex items-center justify-between px-5 pt-4 pb-1.5 text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase">
              <span className={iso === today ? "text-fg" : ""}>
                {dayLabel(iso, today)}
                {iso === today || iso === addDays(today, 1) ? (
                  <span className="ml-2 font-normal tracking-normal normal-case">{dayLabel(iso, "")}</span>
                ) : null}
              </span>
              <button
                type="button"
                aria-label={`Add event on ${iso}`}
                onClick={() => onNewOn(iso)}
                className="grid size-8 place-items-center rounded-full text-[12px] text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
              >
                <FA icon={faPlus} />
              </button>
            </h2>
            <ul className="flex flex-col gap-1.5 px-3 sm:px-4">
              {events.map((ev) => (
                <li key={`${ev.id}-${iso}`}>
                  <button
                    type="button"
                    onClick={() => onOpenEvent(ev)}
                    className={`at-${toneOf(ev.color)} tint flex w-full items-start gap-3 rounded-r2 px-3.5 py-2.5 text-left transition-[filter] hover:brightness-95`}
                  >
                    <span className="w-[84px] shrink-0 pt-px text-[13px] opacity-80 max-sm:w-[62px]">
                      {ev.all_day ? "All day" : timeLabel(hhmm(new Date(ev.start_at)), true)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-medium">{ev.title}</span>
                      {!ev.all_day && (
                        <span className="block text-[12.5px] opacity-75">
                          {timeLabel(hhmm(new Date(ev.start_at)))} – {timeLabel(hhmm(new Date(ev.end_at)))}
                        </span>
                      )}
                      {ev.location && (
                        <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] opacity-75">
                          <FA icon={faLocationDot} className="text-[10px]" />
                          <span className="truncate">{ev.location}</span>
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
              {tasks.map((t) => (
                <li key={t.id} className="pl-[26px] max-sm:pl-3">
                  <TaskChip task={t} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {empty && <p className="ap-none">Nothing coming up. Add an event, or give a task a due date.</p>}
    </section>
  );
}
