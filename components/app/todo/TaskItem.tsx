"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCalendarDay, faCheck, faInbox, faPen, faRotate, faTrash, faHashtag } from "@fortawesome/free-solid-svg-icons";
import type { Task, TaskList } from "../../../lib/workspace";
import { dayLabel } from "../../../lib/dates";

export type RowCtx = {
  today: string;
  lists: TaskList[];
  selected: Set<string>;
  onToggle: (t: Task) => void;
  onOpen: (t: Task) => void;
  onDelete: (t: Task) => void;
  onSelect: (t: Task) => void;
};

export default function TaskItem({ task: t, ctx, showList = true }: { task: Task; ctx: RowCtx; showList?: boolean }) {
  const list = ctx.lists.find((l) => l.id === t.list_id);
  const late = !t.done && !!t.due_date && t.due_date < ctx.today;
  const tone = !t.due_date ? "" : late ? "late" : t.due_date === ctx.today ? "today" : "later";
  const chosen = ctx.selected.has(t.id);

  return (
    <li
      className="ti"
      data-task-row
      data-task-id={t.id}
      data-done={t.done}
      data-cancelled={t.cancelled}
      data-selected={chosen}
      tabIndex={0}
      onClick={(e) => { if (e.metaKey || e.ctrlKey) { e.preventDefault(); ctx.onSelect(t); } else ctx.onOpen(t); }}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) ctx.onOpen(t); }}
    >
      <button
        className="ti-check"
        data-p={t.priority}
        role="checkbox"
        aria-checked={t.done}
        aria-label={`Mark “${t.title}” ${t.done ? "not done" : "done"}`}
        onClick={(e) => { e.stopPropagation(); ctx.onToggle(t); }}
        disabled={t.cancelled || t.archived}
      >
        {t.done && <FA icon={faCheck} />}
      </button>
      <div className="ti-main">
        <span className="ti-title">{t.title}</span>
        {t.description && <span className="ti-desc">{t.description}</span>}
        {(t.due_date || t.recurrence) && (
          <span className="ti-meta">
            {t.due_date && <span data-tone={tone}><FA icon={faCalendarDay} /> {dayLabel(t.due_date, ctx.today)}</span>}
            {t.recurrence && <span title="Repeats"><FA icon={faRotate} /> {t.recurrence}</span>}
          </span>
        )}
      </div>
      {showList && (
        <span className="ti-list" data-tone={list?.color}>
          {list ? <><FA icon={faHashtag} /> {list.name}</> : <>Inbox <FA icon={faInbox} /></>}
        </span>
      )}
      <span className="ti-acts">
        <button className="icon-btn" aria-label={`Edit “${t.title}”`} onClick={(e) => { e.stopPropagation(); ctx.onOpen(t); }}><FA icon={faPen} /></button>
        <button className="icon-btn" aria-label={`Delete “${t.title}”`} onClick={(e) => { e.stopPropagation(); ctx.onDelete(t); }}><FA icon={faTrash} /></button>
      </span>
    </li>
  );
}
