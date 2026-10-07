"use client";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCalendarDay, faFlag, faRotate, faXmark, faHashtag } from "@fortawesome/free-solid-svg-icons";
import { PRIORITIES, RECURRENCES, type Draft } from "../../../lib/tasks";
import { addDays, isoDate } from "../../../lib/dates";
import type { TaskList } from "../../../lib/workspace";

/** Used for quick add, inline add and editing. */
export default function TaskForm({
  initial,
  lists,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus = true,
}: {
  initial: Draft;
  lists: TaskList[];
  submitLabel: string;
  onSubmit: (d: Draft) => void | Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const today = isoDate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.title.trim() || busy) return;
    setBusy(true);
    await onSubmit({ ...d, title: d.title.trim(), description: d.description.trim() });
    setBusy(false);
  }

  return (
    <form
      className="tf"
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === "Escape" && onCancel) {
          e.stopPropagation();
          onCancel();
        }
      }}
    >
      <input
        className="tf-title"
        value={d.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="Task name"
        maxLength={300}
        autoFocus={autoFocus}
        aria-label="Task name"
      />
      <textarea
        className="tf-desc"
        value={d.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Description"
        rows={2}
        maxLength={5000}
        aria-label="Description"
      />
      <div className="tf-pills">
        <label className="tf-pill" data-set={!!d.due_date} data-tone={d.due_date && d.due_date < today ? "late" : undefined}>
          <FA icon={faCalendarDay} />
          <input type="date" value={d.due_date ?? ""} onChange={(e) => set("due_date", e.target.value || null)} aria-label="Due date" />
          {d.due_date && (
            <button
              type="button"
              aria-label="Clear date"
              onClick={(e) => {
                e.preventDefault();
                set("due_date", null);
              }}
            >
              <FA icon={faXmark} />
            </button>
          )}
        </label>
        <button type="button" className="tf-quick" onClick={() => set("due_date", today)}>
          Today
        </button>
        <button type="button" className="tf-quick" onClick={() => set("due_date", addDays(today, 1))}>
          Tomorrow
        </button>
        <label className="tf-pill" data-p={d.priority}>
          <FA icon={faFlag} />
          <select value={d.priority} onChange={(e) => set("priority", Number(e.target.value) as Draft["priority"])} aria-label="Priority">
            {PRIORITIES.map((p) => (
              <option key={p.p} value={p.p}>
                P{p.p} · {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="tf-pill">
          <FA icon={faHashtag} />
          <select value={d.list_id ?? ""} onChange={(e) => set("list_id", e.target.value || null)} aria-label="List">
            <option value="">Inbox</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="tf-pill" data-set={!!d.recurrence}>
          <FA icon={faRotate} />
          <select value={d.recurrence ?? ""} onChange={(e) => set("recurrence", e.target.value || null)} aria-label="Repeat">
            {RECURRENCES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="tf-acts">
        {onCancel && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button className="btn btn-primary btn-sm" disabled={!d.title.trim() || busy}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
