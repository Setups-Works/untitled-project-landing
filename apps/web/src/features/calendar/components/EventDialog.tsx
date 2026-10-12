"use client";

import { useState, type FormEvent } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faAlignLeft, faCalendarDay, faCheck, faClock, faLocationDot, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import JournalCalendar from "../../../components/app/JournalCalendar";
import Modal from "../../../components/ui/Modal";
import { dayLabel, isoDate } from "../../../lib/dates";
import { CALENDAR_TONES, type EventDraft } from "../types";
import { TIME_OPTIONS, timeLabel } from "../utils";

const at = (date: string, time: string) => new Date(`${date}T${time}:00`).getTime();
const toLocal = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return { date: isoDate(d), time: `${p(d.getHours())}:${p(d.getMinutes())}` };
};

/**
 * Create / edit form. It is mounted only while open (the parent renders it conditionally), so the initial values are plain
 * `useState` defaults — no effect re-syncing them. `onSave` resolves to false when the save failed; the parent shows the message.
 */
export default function EventDialog({
  initial,
  editing,
  onSave,
  onDelete,
  onClose,
}: {
  initial: EventDraft;
  editing: boolean;
  onSave: (d: EventDraft) => Promise<boolean>;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const today = isoDate();
  const set = <K extends keyof EventDraft>(k: K, v: EventDraft[K]) => setD((p) => ({ ...p, [k]: v }));

  // Moving the start moves the end with it, so the event keeps its length.
  const moveStart = (date: string, time: string) =>
    setD((p) => {
      const length = Math.max(at(p.end_date, p.end_time) - at(p.start_date, p.start_time), 0);
      const end = toLocal(at(date, time) + length);
      return { ...p, start_date: date, start_time: time, end_date: end.date, end_time: end.time };
    });
  const moveStartDate = (date: string) =>
    setD((p) => {
      // All-day events keep whole days; timed events keep their length.
      if (p.all_day) return { ...p, start_date: date, end_date: p.end_date < date ? date : p.end_date };
      const length = Math.max(at(p.end_date, p.end_time) - at(p.start_date, p.start_time), 0);
      const end = toLocal(at(date, p.start_time) + length);
      return { ...p, start_date: date, end_date: end.date, end_time: end.time };
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!d.title.trim()) return setErr("Give the event a title.");
    if (!d.all_day && at(d.end_date, d.end_time) <= at(d.start_date, d.start_time)) return setErr("The event has to end after it starts.");
    if (d.all_day && d.end_date < d.start_date) return setErr("The last day can’t be before the first.");
    setBusy(true);
    setErr("");
    const ok = await onSave(d);
    setBusy(false);
    if (ok) onClose();
    else setErr("Couldn’t save that event. Try again.");
  };

  const label = editing ? "Edit event" : "New event";
  const datePill = (value: string, onPick: (iso: string) => void) => (
    // The to-do form's pills open their calendar upward (they sit at the bottom of that dialog); these sit near the top, so open it downward.
    <div className="tf-pill tf-date [&_.jc-pop]:top-[calc(100%+8px)] [&_.jc-pop]:bottom-auto [&_.jc-pop]:left-0" data-set>
      <FA icon={faCalendarDay} />
      <JournalCalendar value={value} today={today} counts={{}} allowFuture label={dayLabel(value, today)} onPick={onPick} />
    </div>
  );
  const timePill = (value: string, onChange: (t: string) => void, name: string) => (
    <label className="tf-pill">
      <FA icon={faClock} />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={name}>
        {(TIME_OPTIONS.includes(value) ? TIME_OPTIONS : [...TIME_OPTIONS, value].sort()).map((t) => (
          <option key={t} value={t}>
            {timeLabel(t)}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <Modal label={label} onClose={onClose}>
      <form className="td" onSubmit={submit}>
        <div className="td-head">
          <h2 className="h3">{label}</h2>
          <button type="button" className="ne-btn" aria-label="Close" onClick={onClose}>
            <FA icon={faXmark} />
          </button>
        </div>

        <div className="tf">
          <input
            className="tf-title"
            value={d.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Event title"
            aria-label="Event title"
            maxLength={300}
            autoFocus
          />

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-12 text-[12.5px] text-fg-subtle">Starts</span>
              {datePill(d.start_date, moveStartDate)}
              {!d.all_day && timePill(d.start_time, (t) => moveStart(d.start_date, t), "Start time")}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-12 text-[12.5px] text-fg-subtle">Ends</span>
              {datePill(d.end_date, (iso) => set("end_date", iso))}
              {!d.all_day && timePill(d.end_time, (t) => set("end_time", t), "End time")}
            </div>
          </div>

          <div className="tf-pills">
            <button
              type="button"
              className="tf-pill"
              data-set={d.all_day}
              aria-pressed={d.all_day}
              onClick={() => set("all_day", !d.all_day)}
            >
              <FA icon={faClock} /> All day
            </button>
            <label className="tf-pill min-w-0 flex-1">
              <FA icon={faLocationDot} />
              <input
                className="w-full cursor-text"
                value={d.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Location or meeting link"
                aria-label="Location"
                maxLength={300}
              />
            </label>
          </div>

          <div role="radiogroup" aria-label="Colour" className="mt-1 flex flex-wrap items-center gap-2.5 px-1">
            {CALENDAR_TONES.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={d.color === t}
                aria-label={t}
                title={t}
                onClick={() => set("color", t)}
                className={`at-${t} grid size-7 place-items-center rounded-full bg-(--abf) text-[11px] text-white transition-transform duration-300 hover:scale-110 ${d.color === t ? "ring-2 ring-(--abf) ring-offset-2" : ""}`}
              >
                {d.color === t && <FA icon={faCheck} />}
              </button>
            ))}
          </div>

          <div className="mt-1 flex items-start gap-2.5 px-1 text-fg-subtle">
            <FA icon={faAlignLeft} className="mt-2 text-[13px]" />
            <textarea
              className="tf-desc"
              value={d.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Notes"
              aria-label="Notes"
              rows={3}
              maxLength={5000}
            />
          </div>

          {err && (
            <p className="form-err" role="alert">
              {err}
            </p>
          )}

          <div className="tf-acts items-center">
            {editing && onDelete && (
              <button type="button" className="btn btn-secondary btn-sm td-del" onClick={onDelete} disabled={busy}>
                <FA icon={faTrash} /> Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save" : "Add event"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
