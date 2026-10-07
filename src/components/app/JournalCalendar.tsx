"use client";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { isoDate } from "../../lib/dates";
import { weekdayIndex, weekdayLabels } from "../../lib/prefs";

/** Month picker. Days that have journal entries get a dot; future days can't be picked. */
export default function JournalCalendar({
  value,
  today,
  counts,
  onPick,
  label,
  allowFuture = false,
}: {
  value: string;
  today: string;
  counts: Record<string, number>;
  onPick: (iso: string) => void;
  /** Show this text (with a chevron) as the trigger instead of a calendar icon. */
  label?: string;
  /** The journal can't be written ahead of time; the to-do list can. */
  allowFuture?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [y0, m0] = value.split("-").map(Number);
  const [view, setView] = useState({ y: y0, m: m0 - 1 });
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const toggle = () => {
    if (!open) setView({ y: y0, m: m0 - 1 });
    setOpen(!open);
  };
  const shift = (n: number) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const first = new Date(view.y, view.m, 1);
  const offset = weekdayIndex(first);
  const cells = Array.from({ length: 42 }, (_, i) => new Date(view.y, view.m, 1 - offset + i));
  const title = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="jc" ref={box}>
      {label ? (
        <button
          type="button"
          className="jc-label"
          aria-label={`${label}, open calendar`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={toggle}
        >
          {label} <FA icon={faChevronDown} />
        </button>
      ) : (
        <button
          type="button"
          className="jc-btn"
          aria-label="Open calendar"
          aria-haspopup="dialog"
          aria-expanded={open}
          data-on={open}
          onClick={toggle}
        >
          <FA icon={faCalendarDays} />
        </button>
      )}
      {open && (
        <div className="jc-pop" role="dialog" aria-label={`Calendar, ${title}`}>
          <div className="jc-head">
            <b>{title}</b>
            <span>
              <button type="button" aria-label="Previous month" onClick={() => shift(-1)}>
                <FA icon={faChevronUp} />
              </button>
              <button type="button" aria-label="Next month" onClick={() => shift(1)}>
                <FA icon={faChevronDown} />
              </button>
            </span>
          </div>
          <div className="jc-grid" role="grid">
            {weekdayLabels("narrow").map((d, i) => (
              <span key={i} className="jc-dow" aria-hidden>
                {d}
              </span>
            ))}
            {cells.map((d) => {
              const iso = isoDate(d);
              const out = d.getMonth() !== view.m;
              const future = !allowFuture && iso > today;
              return (
                <button
                  key={iso}
                  type="button"
                  className="jc-day"
                  data-out={out}
                  data-today={iso === today}
                  data-sel={iso === value}
                  disabled={future}
                  aria-label={
                    d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) +
                    (counts[iso] ? `, ${counts[iso]} entries` : "")
                  }
                  aria-current={iso === today ? "date" : undefined}
                  onClick={() => {
                    onPick(iso);
                    setOpen(false);
                  }}
                >
                  {d.getDate()}
                  {counts[iso] > 0 && <i aria-hidden />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
