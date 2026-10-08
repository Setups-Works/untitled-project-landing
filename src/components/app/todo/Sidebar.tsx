"use client";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faCalendarDay,
  faCalendarDays,
  faChevronDown,
  faChevronRight,
  faCircleCheck,
  faCirclePlus,
  faHashtag,
  faInbox,
  faMagnifyingGlass,
  faPlus,
  faTableCells,
  faTableColumns,
} from "@fortawesome/free-solid-svg-icons";
import { LIST_TONES, type ViewKey } from "../../../lib/tasks";
import type { TaskList } from "../../../lib/workspace";

type Counts = { inbox: number; today: number; lists: Record<string, number> };

export default function Sidebar({
  view,
  lists,
  counts,
  onGo,
  onAdd,
  onSearch,
  onAddList,
  onCollapse,
  collapsed = false,
}: {
  /** Desktop "closed" state: the sidebar shrinks to a rail of icons (the labels become tooltips). */
  collapsed?: boolean;
  view: ViewKey;
  lists: TaskList[];
  counts: Counts;
  onGo: (v: ViewKey) => void;
  onAdd: () => void;
  onSearch: () => void;
  onAddList: (name: string, color: string) => void;
  onCollapse: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(LIST_TONES[0]);

  const item = (v: ViewKey, label: string, icon: typeof faInbox, count?: number) => (
    <button
      key={v}
      className="tsb-item"
      data-on={view === v || (v === "filters" && ["cancelled", "overdue", "recurring", "archived"].includes(view))}
      aria-current={view === v ? "page" : undefined}
      aria-label={label}
      title={label}
      onClick={() => onGo(v)}
    >
      <FA icon={icon} /> <span>{label}</span>
      {!!count && <em>{count}</em>}
    </button>
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    onAddList(n, color);
    setName("");
    setAdding(false);
    setColor(LIST_TONES[(lists.length + 1) % LIST_TONES.length]);
  }

  return (
    <aside className="tsb at-sand" data-rail={collapsed} aria-label="Task navigation">
      <div className="tsb-top">
        <button
          className="ne-btn"
          aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
          title={collapsed ? "Show sidebar (M)" : "Hide sidebar (M)"}
          onClick={onCollapse}
        >
          <FA icon={faTableColumns} />
        </button>
      </div>
      <button className="tsb-item tsb-add" aria-label="Add task" title="Add task" onClick={onAdd}>
        <FA icon={faCirclePlus} /> <span>Add task</span>
      </button>
      <button className="tsb-item" aria-label="Search" title="Search" onClick={onSearch}>
        <FA icon={faMagnifyingGlass} /> <span>Search</span>
      </button>
      <nav className="tsb-nav">
        {item("inbox", "Inbox", faInbox, counts.inbox)}
        {item("today", "Today", faCalendarDay, counts.today)}
        {item("upcoming", "Upcoming", faCalendarDays)}
        {item("filters", "Filters", faTableCells)}
        {item("completed", "Completed", faCircleCheck)}
      </nav>

      <button className="tsb-sec" aria-expanded={open} onClick={() => setOpen(!open)} title="My Lists">
        <FA icon={open ? faChevronDown : faChevronRight} /> My Lists
      </button>
      {open && (
        <div className="tsb-lists">
          {lists.length === 0 && !adding && <p className="tsb-hint">Lists keep related tasks together. Add your first one below.</p>}
          {lists.map((l) => (
            <button
              key={l.id}
              className="tsb-item"
              data-on={view === `list:${l.id}`}
              data-tone={l.color}
              aria-current={view === `list:${l.id}` ? "page" : undefined}
              aria-label={l.name}
              title={l.name}
              onClick={() => onGo(`list:${l.id}`)}
            >
              <FA icon={faHashtag} className="tsb-dot" /> <span>{l.name}</span>
              {!!counts.lists[l.id] && <em>{counts.lists[l.id]}</em>}
            </button>
          ))}
          {adding ? (
            <form
              className="tsb-new"
              onSubmit={submit}
              onKeyDown={(e) => {
                if (e.key === "Escape") setAdding(false);
              }}
            >
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="List name"
                aria-label="List name"
              />
              <div className="tsb-colors" role="group" aria-label="List colour">
                {LIST_TONES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={`at-${t}`}
                    data-on={color === t}
                    aria-label={t}
                    aria-pressed={color === t}
                    onClick={() => setColor(t)}
                  />
                ))}
              </div>
              <div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAdding(false)}>
                  Cancel
                </button>{" "}
                <button className="btn btn-primary btn-sm" disabled={!name.trim()}>
                  Add
                </button>
              </div>
            </form>
          ) : (
            <button className="tsb-item" aria-label="Add list" title="Add list" onClick={() => setAdding(true)}>
              <FA icon={faPlus} /> <span>Add list</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
