"use client";
import { useMemo, useState, type ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faBoxArchive,
  faCalendarDays,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faClockRotateLeft,
  faPlus,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import type { Task, TaskList } from "../../../lib/workspace";
import {
  applyOpts,
  emptyDraft,
  groupTasks,
  isOpen,
  isOverdue,
  type Draft,
  type Group,
  type ViewKey,
  type ViewOpts,
} from "../../../lib/tasks";
import { addDays, isoDate } from "../../../lib/dates";
import { weekdayIndex, weekdayLabels } from "../../../lib/prefs";
import Menu, { MenuItem } from "../../ui/Menu";
import { Tabs, TabsList, TabsTrigger } from "../../ui/Tabs";
import JournalCalendar from "../JournalCalendar";
import TaskForm from "./TaskForm";
import TaskItem, { type RowCtx } from "./TaskItem";

export type VCtx = RowCtx & {
  onAdd: (d: Draft) => Promise<void>;
  onReschedule: (ids: string[], date: string) => void;
  onGo: (v: ViewKey) => void;
};

const TONES = ["violet", "blue", "green", "amber", "clay", "mint", "gold"];

/** "Oct 7 · Today · Wednesday" */
export function dayHead(iso: string, today: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const rel = iso === today ? "Today" : iso === addDays(today, 1) ? "Tomorrow" : "";
  return [dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }), rel, dt.toLocaleDateString(undefined, { weekday: "long" })]
    .filter(Boolean)
    .join(" · ");
}

export function Empty({ icon, title, text }: { icon: typeof faCircleCheck; title: string; text: string }) {
  return (
    <div className="tv-empty">
      <span>
        <FA icon={icon} />
      </span>
      <b>{title}</b>
      <p>{text}</p>
    </div>
  );
}

function InlineAdd({ ctx, defaults, label = "Add task" }: { ctx: VCtx; defaults: Partial<Draft>; label?: string }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button className="tv-add" onClick={() => setOpen(true)}>
        <FA icon={faPlus} /> {label}
      </button>
    );
  return (
    <div className="tv-addform">
      <TaskForm
        initial={emptyDraft(defaults)}
        lists={ctx.lists}
        submitLabel="Add task"
        onCancel={() => setOpen(false)}
        onSubmit={async (d) => {
          await ctx.onAdd(d);
        }}
      />
    </div>
  );
}

function Section({
  title,
  count,
  tone,
  tasks,
  ctx,
  defaults,
  action,
  showList = true,
  collapsible = true,
  empty,
}: {
  title: ReactNode;
  count?: number;
  tone: string;
  tasks: Task[];
  ctx: VCtx;
  defaults?: Partial<Draft>;
  action?: ReactNode;
  showList?: boolean;
  collapsible?: boolean;
  empty?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className={`ap-card at-${tone} tv-sec`}>
      {(title || action) && (
        <header className="tv-sec-h">
          {collapsible && title ? (
            <button aria-expanded={open} aria-label={open ? "Collapse section" : "Expand section"} onClick={() => setOpen(!open)}>
              <FA icon={open ? faChevronDown : faChevronRight} />
            </button>
          ) : null}
          <h3>{title}</h3>
          {count !== undefined && <small>{count}</small>}
          <span className="tv-sec-a">{action}</span>
        </header>
      )}
      {open && (
        <>
          {tasks.length > 0 && (
            <ul>
              {tasks.map((t) => (
                <TaskItem key={t.id} task={t} ctx={ctx} showList={showList} />
              ))}
            </ul>
          )}
          {tasks.length === 0 && empty && <p className="ap-none">{empty}</p>}
          {defaults && <InlineAdd ctx={ctx} defaults={defaults} />}
        </>
      )}
    </section>
  );
}

function Reschedule({ ids, ctx, today }: { ids: string[]; ctx: VCtx; today: string }) {
  const opts: [string, string][] = [
    ["Today", today],
    ["Tomorrow", addDays(today, 1)],
    ["Next week", addDays(today, 7)],
  ];
  return (
    <Menu label="Reschedule overdue tasks" trigger={<span className="tv-resched">Reschedule</span>}>
      {opts.map(([l, d]) => (
        <MenuItem key={l} onSelect={() => ctx.onReschedule(ids, d)}>
          {l}
        </MenuItem>
      ))}
    </Menu>
  );
}

function groupDefaults(g: Group): Partial<Draft> {
  if (g.date) return { due_date: g.date };
  if (/^p[1-4]$/.test(g.key)) return { priority: Number(g.key[1]) as Draft["priority"] };
  if (/^[0-9a-f-]{36}$/i.test(g.key)) return { list_id: g.key };
  return {};
}

/* ---------- list layout ---------- */
export function ListLayout({
  view,
  tasks,
  opts,
  lists,
  ctx,
  today,
  defaults,
  tone,
}: {
  view: ViewKey;
  tasks: Task[];
  opts: ViewOpts;
  lists: TaskList[];
  ctx: VCtx;
  today: string;
  defaults: Partial<Draft>;
  tone: string;
}) {
  const sorted = useMemo(() => applyOpts(tasks, opts), [tasks, opts]);
  if (opts.groupBy !== "none") {
    const groups = groupTasks(sorted, opts.groupBy, lists, today);
    return (
      <>
        {groups.map((g) => (
          <Section
            key={g.key}
            title={g.title}
            count={g.tasks.length}
            tone={g.tone ?? tone}
            tasks={g.tasks}
            ctx={ctx}
            defaults={groupDefaults(g)}
            showList={opts.groupBy !== "list"}
          />
        ))}
        {groups.length === 0 && <InlineAdd ctx={ctx} defaults={defaults} />}
      </>
    );
  }
  if (view === "today") {
    const late = sorted.filter((t) => isOverdue(t, today));
    const now = sorted.filter((t) => t.due_date === today);
    return (
      <>
        {late.length > 0 && (
          <Section
            title="Overdue"
            count={late.length}
            tone="clay"
            tasks={late}
            ctx={ctx}
            action={<Reschedule ids={late.map((t) => t.id)} ctx={ctx} today={today} />}
          />
        )}
        <Section title={dayHead(today, today)} tone="amber" tasks={now} ctx={ctx} defaults={defaults} collapsible={false} />
      </>
    );
  }
  const canAdd = view === "inbox" || view.startsWith("list:");
  return (
    <Section
      title=""
      tone={tone}
      tasks={sorted}
      ctx={ctx}
      defaults={canAdd ? defaults : undefined}
      empty={
        canAdd
          ? undefined
          : view === "overdue"
            ? "Nothing overdue. Nice."
            : view === "recurring"
              ? "No recurring tasks. Set “Repeat” on a task to add one."
              : view === "cancelled"
                ? "No cancelled tasks."
                : view === "archived"
                  ? "Nothing archived."
                  : "No tasks."
      }
    />
  );
}

/* ---------- board layout ---------- */
export function BoardLayout({
  tasks,
  opts,
  lists,
  ctx,
  today,
  defaults,
}: {
  tasks: Task[];
  opts: ViewOpts;
  lists: TaskList[];
  ctx: VCtx;
  today: string;
  defaults: Partial<Draft>;
}) {
  const sorted = useMemo(() => applyOpts(tasks, opts), [tasks, opts]);
  const cols: Group[] = useMemo(() => {
    if (opts.groupBy !== "none") return groupTasks(sorted, opts.groupBy, lists, today);
    const open = (t: Task) => isOpen(t);
    return [
      { key: "late", title: "Overdue", tone: "clay", tasks: sorted.filter((t) => open(t) && t.due_date && t.due_date < today) },
      { key: "today", title: "Today", tone: "amber", tasks: sorted.filter((t) => open(t) && t.due_date === today), date: today },
      {
        key: "later",
        title: "Upcoming",
        tone: "mint",
        tasks: sorted.filter((t) => open(t) && t.due_date && t.due_date > today),
        date: addDays(today, 1),
      },
      { key: "none", title: "No date", tone: "sand", tasks: sorted.filter((t) => open(t) && !t.due_date) },
      ...(opts.showCompleted ? [{ key: "done", title: "Completed", tone: "green", tasks: sorted.filter((t) => t.done) }] : []),
    ];
  }, [sorted, opts.groupBy, opts.showCompleted, lists, today]);
  return (
    <div className="tv-board">
      {cols.map((c) => (
        <section key={c.key} className={`ap-card at-${c.tone ?? "sand"} tv-col`}>
          <header className="tv-sec-h">
            <h3>{c.title}</h3>
            <small>{c.tasks.length}</small>
          </header>
          {c.tasks.length > 0 && (
            <ul>
              {c.tasks.map((t) => (
                <TaskItem key={t.id} task={t} ctx={ctx} showList={opts.groupBy !== "list"} />
              ))}
            </ul>
          )}
          {c.key !== "done" && <InlineAdd ctx={ctx} defaults={{ ...defaults, ...groupDefaults(c) }} />}
        </section>
      ))}
    </div>
  );
}

/* ---------- calendar layout ---------- */
export function CalendarLayout({
  tasks,
  opts,
  ctx,
  today,
  onAddOn,
}: {
  tasks: Task[];
  opts: ViewOpts;
  ctx: VCtx;
  today: string;
  onAddOn: (date: string) => void;
}) {
  const [view, setView] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const sorted = useMemo(() => applyOpts(tasks, opts), [tasks, opts]);
  const by = useMemo(() => {
    const m = new Map<string, Task[]>();
    sorted.forEach((t) => {
      if (t.due_date) m.set(t.due_date, [...(m.get(t.due_date) ?? []), t]);
    });
    return m;
  }, [sorted]);
  const first = new Date(view.y, view.m, 1);
  const offset = weekdayIndex(first);
  const cells = Array.from({ length: 42 }, (_, i) => new Date(view.y, view.m, 1 - offset + i));
  const shift = (n: number) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  return (
    <section className="ap-card at-violet tv-cal">
      <header className="tv-sec-h">
        <h3>{first.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h3>
        <span className="tv-sec-a">
          <button className="ne-btn" aria-label="Previous month" onClick={() => shift(-1)}>
            <FA icon={faChevronLeft} />
          </button>
          <button className="ne-btn" aria-label="Next month" onClick={() => shift(1)}>
            <FA icon={faChevronRight} />
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const d = new Date();
              setView({ y: d.getFullYear(), m: d.getMonth() });
            }}
          >
            Today
          </button>
        </span>
      </header>
      <div className="tv-cal-grid">
        {weekdayLabels("short").map((d) => (
          <span key={d} className="tv-cal-dow">
            {d}
          </span>
        ))}
        {cells.map((d) => {
          const iso = isoDate(d);
          const list = by.get(iso) ?? [];
          return (
            <div key={iso} className="tv-cal-day" data-out={d.getMonth() !== view.m} data-today={iso === today}>
              <button className="tv-cal-num" aria-label={`Add task on ${iso}`} onClick={() => onAddOn(iso)}>
                {d.getDate()}
              </button>
              {list.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  className="tv-cal-chip"
                  data-p={t.priority}
                  data-done={t.done}
                  onClick={() => ctx.onOpen(t)}
                  title={t.title}
                >
                  {t.title}
                </button>
              ))}
              {list.length > 3 && <small>+{list.length - 3} more</small>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- upcoming ---------- */
export function UpcomingView({ tasks, ctx, today }: { tasks: Task[]; ctx: VCtx; today: string }) {
  const [sel, setSel] = useState(today);
  const [days, setDays] = useState(14);
  const open = tasks.filter(isOpen);
  const overdue = open.filter((t) => isOverdue(t, today));
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    open.forEach((t) => {
      if (t.due_date) c[t.due_date] = (c[t.due_date] || 0) + 1;
    });
    return c;
  }, [open]);

  const [y, m, d] = sel.split("-").map(Number);
  const weekStart = addDays(sel, -weekdayIndex(new Date(y, m - 1, d)));
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const label = new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const list = Array.from({ length: days }, (_, i) => addDays(sel, i));

  return (
    <>
      <div className="tv-up-head">
        <JournalCalendar value={sel} today={today} counts={counts} onPick={setSel} label={label} allowFuture />
        <span className="tv-up-nav">
          <button className="ne-btn" aria-label="Previous week" onClick={() => setSel(addDays(sel, -7))}>
            <FA icon={faChevronLeft} />
          </button>
          <button className="ne-btn" aria-label="Next week" onClick={() => setSel(addDays(sel, 7))}>
            <FA icon={faChevronRight} />
          </button>
          <button className="tv-today" onClick={() => setSel(today)}>
            Today
          </button>
        </span>
      </div>
      <Tabs value={sel} onValueChange={setSel}>
        <TabsList className="tv-week" aria-label="Week">
          {week.map((iso) => {
            const dt = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8)));
            return (
              <TabsTrigger key={iso} value={iso} data-today={iso === today}>
                <small>{dt.toLocaleDateString(undefined, { weekday: "short" })}</small>
                <b>{dt.getDate()}</b>
                {counts[iso] > 0 && <i aria-hidden />}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      {overdue.length > 0 && (
        <Section
          title="Overdue"
          count={overdue.length}
          tone="clay"
          tasks={overdue}
          ctx={ctx}
          action={<Reschedule ids={overdue.map((t) => t.id)} ctx={ctx} today={today} />}
        />
      )}
      {list.map((iso, i) => (
        <Section
          key={iso}
          title={dayHead(iso, today)}
          tone={TONES[(i + 3) % TONES.length]}
          tasks={open.filter((t) => t.due_date === iso)}
          ctx={ctx}
          defaults={{ due_date: iso }}
          collapsible={false}
        />
      ))}
      <button className="btn btn-secondary btn-sm tv-more" onClick={() => setDays(days + 14)}>
        Show 2 more weeks
      </button>
    </>
  );
}

/* ---------- filters index ---------- */
export function FiltersIndex({ tasks, today, onGo }: { tasks: Task[]; today: string; onGo: (v: ViewKey) => void }) {
  const rows: [ViewKey, string, typeof faCircleCheck, string, number][] = [
    ["upcoming", "Upcoming", faCalendarDays, "blue", tasks.filter((t) => isOpen(t) && !!t.due_date).length],
    ["completed", "Completed", faCircleCheck, "green", tasks.filter((t) => t.done && !t.archived).length],
    ["cancelled", "Cancelled", faBan, "sand", tasks.filter((t) => t.cancelled && !t.archived).length],
    ["overdue", "Overdue", faClockRotateLeft, "clay", tasks.filter((t) => isOverdue(t, today)).length],
    ["recurring", "Recurring", faRotate, "violet", tasks.filter((t) => !!t.recurrence && !t.done && !t.archived && !t.cancelled).length],
    ["archived", "Archived", faBoxArchive, "gold", tasks.filter((t) => t.archived).length],
  ];
  return (
    <ul className="tv-filters">
      {rows.map(([v, label, icon, tone, n]) => (
        <li key={v}>
          <button className={`at-${tone}`} onClick={() => onGo(v)}>
            <span>
              <FA icon={icon} />
            </span>
            <b>{label}</b>
            {n > 0 && <em>{n}</em>}
            <FA icon={faChevronRight} className="tv-go" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ---------- completed ---------- */
export function CompletedView({ tasks, lists, ctx, today }: { tasks: Task[]; lists: TaskList[]; ctx: VCtx; today: string }) {
  const [listId, setListId] = useState("all");
  const done = useMemo(
    () =>
      tasks
        .filter((t) => t.done && !t.archived && (listId === "all" || (listId === "inbox" ? !t.list_id : t.list_id === listId)))
        .sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? "")),
    [tasks, listId],
  );
  const groups = useMemo(() => {
    const m = new Map<string, Task[]>();
    done.forEach((t) => {
      const k = t.done_at ? isoDate(new Date(t.done_at)) : "none";
      m.set(k, [...(m.get(k) ?? []), t]);
    });
    return [...m.entries()];
  }, [done]);
  return (
    <>
      <label className="tv-select">
        <select value={listId} onChange={(e) => setListId(e.target.value)} aria-label="Filter by list">
          <option value="all">All lists</option>
          <option value="inbox">Inbox</option>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      {groups.length === 0 && (
        <Empty icon={faCircleCheck} title="Nothing completed yet" text="Completed tasks will collect here as you check them off." />
      )}
      {groups.map(([k, list], i) => (
        <Section
          key={k}
          title={k === "none" ? "Earlier" : dayHead(k, today)}
          count={list.length}
          tone={TONES[(i + 2) % TONES.length]}
          tasks={list}
          ctx={ctx}
        />
      ))}
    </>
  );
}
