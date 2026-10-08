"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCalendarDay, faCheck, faInbox, faPen, faRotate, faTrash, faHashtag } from "@fortawesome/free-solid-svg-icons";
import type { Task, TaskList } from "../../../lib/workspace";
import { dayLabel } from "../../../lib/dates";
import { ctxProps } from "../../../lib/context-actions";
import { recurrenceLabel } from "../../../lib/tasks";
import Markdown from "../Markdown";

/** The first few lines of a description for the list row, with an ellipsis when there is more. */
const shortDescription = (text: string) => {
  const lines = text.trim().split("\n");
  return lines.length > 4 ? `${lines.slice(0, 4).join("\n")}\n…` : text.trim();
};

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
      {...ctxProps("task", t.id, { done: t.done })}
      data-done={t.done}
      data-cancelled={t.cancelled}
      data-selected={chosen}
      tabIndex={0}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          ctx.onSelect(t);
        } else ctx.onOpen(t);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) ctx.onOpen(t);
      }}
    >
      <button
        className="ti-check"
        data-p={t.priority}
        role="checkbox"
        aria-checked={t.done}
        aria-label={`Mark “${t.title}” ${t.done ? "not done" : "done"}`}
        onClick={(e) => {
          e.stopPropagation();
          ctx.onToggle(t);
        }}
        disabled={t.cancelled || t.archived}
      >
        {t.done && <FA icon={faCheck} />}
      </button>
      <div className="ti-main">
        <span className="ti-title">{t.title}</span>
        {t.description && (
          // Rendered as Markdown so lists (a shopping list) and links to other items, with their hover cards, work here too.
          // The hover card needs room, so the text is cut by lines instead of clipped by the box.
          <div
            className="ti-desc-md"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) e.stopPropagation(); // a link opens its target, not the task
            }}
          >
            <Markdown text={shortDescription(t.description)} />
          </div>
        )}
        {(t.due_date || t.recurrence) && (
          <span className="ti-meta">
            {t.due_date && (
              <span data-tone={tone}>
                <FA icon={faCalendarDay} /> {dayLabel(t.due_date, ctx.today)}
              </span>
            )}
            {t.recurrence && (
              <span title="Repeats">
                <FA icon={faRotate} /> {recurrenceLabel(t.recurrence)}
              </span>
            )}
          </span>
        )}
      </div>
      {showList && (
        <span className="ti-list" data-tone={list?.color}>
          {list ? (
            <>
              <FA icon={faHashtag} /> {list.name}
            </>
          ) : (
            <>
              Inbox <FA icon={faInbox} />
            </>
          )}
        </span>
      )}
      <span className="ti-acts">
        <button
          className="icon-btn"
          aria-label={`Edit “${t.title}”`}
          onClick={(e) => {
            e.stopPropagation();
            ctx.onOpen(t);
          }}
        >
          <FA icon={faPen} />
        </button>
        <button
          className="icon-btn"
          aria-label={`Delete “${t.title}”`}
          onClick={(e) => {
            e.stopPropagation();
            ctx.onDelete(t);
          }}
        >
          <FA icon={faTrash} />
        </button>
      </span>
    </li>
  );
}
