"use client";
import { useEffect, useRef, useState } from "react";
import { readText, writeText } from "../../../lib/drafts";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCalendarDay, faFlag, faRotate, faXmark, faHashtag } from "@fortawesome/free-solid-svg-icons";
import { PRIORITIES, recurrenceChoices, type Draft } from "../../../lib/tasks";
import { addDays, dayLabel, isoDate } from "../../../lib/dates";
import JournalCalendar from "../JournalCalendar";
import type { TaskList } from "../../../lib/workspace";

/** Used for quick add, inline add and editing. */
export default function TaskForm({
  initial,
  lists,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus = true,
  draftKey,
}: {
  initial: Draft;
  lists: TaskList[];
  submitLabel: string;
  onSubmit: (d: Draft) => void | Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
  /** For "new task" forms: keeps the typed name and description in this browser until the task is added, so a refresh doesn't lose them. */
  draftKey?: string;
}) {
  const [d, setD] = useState<Draft>(() => {
    if (!draftKey) return initial;
    try {
      const s = JSON.parse(readText(draftKey) ?? "null") as { title?: unknown; description?: unknown } | null;
      return s ? { ...initial, title: String(s.title ?? ""), description: String(s.description ?? "") } : initial;
    } catch {
      return initial;
    }
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const today = isoDate();
  const sent = useRef(false);
  const desc = useRef<HTMLTextAreaElement>(null);

  // The description grows with its text (up to a limit, then scrolls) so a list or a long note is readable without hunting for it.
  useEffect(() => {
    const el = desc.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [d.description]);

  useEffect(() => {
    if (!draftKey || sent.current) return;
    writeText(draftKey, d.title || d.description ? JSON.stringify({ title: d.title, description: d.description }) : "");
  }, [draftKey, d.title, d.description]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.title.trim() || busy) return;
    setBusy(true);
    await onSubmit({ ...d, title: d.title.trim(), description: d.description.trim() });
    if (draftKey) {
      sent.current = true;
      writeText(draftKey, "");
    }
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
        ref={desc}
        className="tf-desc"
        value={d.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Description"
        rows={2}
        maxLength={5000}
        aria-label="Description"
      />
      <div className="tf-pills">
        <div className="tf-pill tf-date" data-set={!!d.due_date} data-tone={d.due_date && d.due_date < today ? "late" : undefined}>
          <FA icon={faCalendarDay} />
          {/* The site's own calendar instead of the browser's date picker. */}
          <JournalCalendar
            value={d.due_date ?? today}
            today={today}
            counts={{}}
            allowFuture
            label={d.due_date ? dayLabel(d.due_date, today) : "Due date"}
            onPick={(iso) => set("due_date", iso)}
          />
          {d.due_date && (
            <button type="button" aria-label="Clear date" onClick={() => set("due_date", null)}>
              <FA icon={faXmark} />
            </button>
          )}
        </div>
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
            {recurrenceChoices(d.due_date, d.recurrence).map(([v, l]) => (
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
