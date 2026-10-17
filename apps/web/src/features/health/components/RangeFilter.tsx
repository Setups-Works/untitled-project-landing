"use client";

import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { useMemo } from "react";
import JournalCalendar from "../../../components/app/JournalCalendar";
import { dayRange, HEALTH_RANGES, rangeMeta, stepRange, type HealthRange } from "../format";

const shortDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/**
 * The Health filter, laid out like the Journal's: quick pills (Today / Yesterday / 7 days / 30 days) and a date card with ‹ calendar ›
 * to step one day or jump to any day (the Journal's own calendar; days that have data get a dot, the future can't be picked). The date
 * card shows the weekday and date and, on the right, how many figures were recorded that day (or how many days had data in a window).
 */
export default function RangeFilter({
  value,
  onChange,
  today,
  daysWithData,
  count,
  pills = true,
}: {
  value: HealthRange;
  onChange: (r: HealthRange) => void;
  today: string;
  /** Days (YYYY-MM-DD) that have any reading, marked in the calendar. */
  daysWithData: string[];
  /** Shown on the right of the date card. */
  count: number;
  /** The Today / Yesterday / 7 days / 30 days pills above the date card. Off where only one day at a time makes sense. */
  pills?: boolean;
}) {
  const meta = rangeMeta(value, today);
  const counts = useMemo(() => Object.fromEntries(daysWithData.map((d) => [d, 1])), [daysWithData]);
  const back = stepRange(value, today, -1);
  const forward = stepRange(value, today, 1);
  const single = meta.days === 1;
  const weekday = single ? new Date(`${meta.from}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" }) : meta.label;
  const title = single
    ? new Date(`${meta.from}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "long" })
    : `${shortDate(meta.from)} – ${shortDate(meta.to)}`;
  const arrow =
    "grid size-[42px] place-items-center rounded-full text-fg-muted transition-colors hover:bg-white/60 active:scale-95 disabled:opacity-35 disabled:hover:bg-transparent";

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-3">
      {pills && (
        <div role="group" aria-label="Show health for" className="glass inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-pill p-1">
          {HEALTH_RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              aria-pressed={value === r.key}
              onClick={() => onChange(r.key)}
              className="h-9 shrink-0 rounded-pill px-4 text-[13.5px] font-medium text-fg-muted transition-colors active:scale-95 aria-pressed:bg-white aria-pressed:text-fg aria-pressed:shadow-e1"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      <div className="at-sand tint flex flex-col gap-3 rounded-r4 p-3.5">
        <div className="flex items-center justify-between px-1">
          <button type="button" aria-label="Previous day" disabled={!back} onClick={() => back && onChange(back)} className={arrow}>
            <FA icon={faChevronLeft} />
          </button>
          <JournalCalendar
            value={single ? meta.from : today}
            today={today}
            counts={counts}
            onPick={(iso) => onChange(iso === today ? "today" : dayRange(iso))}
          />
          <button type="button" aria-label="Next day" disabled={!forward} onClick={() => forward && onChange(forward)} className={arrow}>
            <FA icon={faChevronRight} />
          </button>
        </div>
        <div
          className="flex min-h-[76px] items-center justify-between rounded-r3 border-2 border-green-fg bg-green-bg px-4 py-2.5"
          aria-live="polite"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold tracking-[0.1em] text-green-fg uppercase">{weekday}</span>
            <span className="text-[19px] leading-6 font-semibold">{title}</span>
          </div>
          <span className="text-fg-subtle" aria-label={`${count} recorded`}>
            {count}
          </span>
        </div>
      </div>
    </div>
  );
}
