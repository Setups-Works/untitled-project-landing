"use client";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBookOpen,
  faCalendarDay,
  faComments,
  faHeartPulse,
  faListCheck,
  faNewspaper,
  faPenToSquare,
  faPlus,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { fmtDuration } from "@untitled/logic/health";
import { api } from "../../lib/api/client";
import { qk } from "../../lib/query/keys";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate";
import { useDraftText } from "../../hooks/useDraft";
import { useTaskActions } from "../../features/tasks/queries";
import { useCalendarEvents } from "../../features/calendar/queries";
import { groupEventsByDay } from "../../features/calendar/utils";
import { useArticles, useFeeds } from "../../features/rss/queries";
import { useHealthDays } from "../../features/health/queries";
import { useMyInvites } from "../../features/collaboration";
import { addDays, ago, greeting, isoDate } from "../../lib/dates";
import type { Chat, Note, Profile, Task } from "../../lib/workspace";
import { fmtTime } from "../../lib/prefs";
import { useHomeLayout, type HomeColumn } from "../../features/home/useHomeLayout";
import DragHandle from "../../features/home/DragHandle";
import TaskRow from "./TaskRow";
import InsightsCard from "./InsightsCard";

// Stable empty values so a still-loading query doesn't create a new array on every render.
const EMPTY_TASKS: Task[] = [];
const EMPTY_CHATS: Chat[] = [];
const EMPTY_NOTES: Pick<Note, "id" | "title" | "updated_at">[] = [];
const EMPTY_ENTRIES: { id: string; body: string; created_at: string }[] = [];

const QUICK = [
  { href: "/dashboard/todo", t: "Plan my day", icon: faListCheck },
  { href: "/dashboard/journal", t: "Journal", icon: faBookOpen },
  { href: "/dashboard/notes?new=1", t: "New note", icon: faPenToSquare },
  { href: "/dashboard/chat?new=1", t: "New chat", icon: faComments },
];

/** A quiet glass panel: small tinted icon, a label, an optional link to the full screen. */
function Panel({
  icon,
  title,
  href,
  hint,
  className = "",
  drag,
  children,
}: {
  icon: IconDefinition;
  title: string;
  href?: string;
  hint?: string;
  className?: string;
  drag?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`liquid-flat rounded-r3 p-[18px] [backdrop-filter:var(--glass-blur)] max-[700px]:p-4 ${className}`}>
      <header className="mb-3 flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-[9px] bg-surface-muted text-[12px] text-fg-muted">
          <FA icon={icon} />
        </span>
        <h2 className="m-0 text-[15px] font-semibold">{title}</h2>
        {hint && <small className="text-[12.5px] opacity-70">{hint}</small>}
        {href && (
          <Link
            href={href}
            className="ml-auto rounded-pill px-2.5 py-1 text-[12.5px] opacity-70 transition-colors hover:bg-surface-muted hover:opacity-100"
          >
            Open
          </Link>
        )}
        <span className={href ? "" : "ml-auto"}>{drag}</span>
      </header>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="m-0 py-1 text-[13.5px] text-fg-subtle">{children}</p>;

export default function HomeView({ name }: { name: string }) {
  const sb = useMemo(api, []);
  const qc = useQueryClient();
  const today = useMemo(() => isoDate(), []);
  const [err, setErr] = useState("");
  // Unsent text survives a refresh. The journal box shares its draft with today's page on the Journal screen.
  const [journal, setJournal] = useDraftText(`journal:${today}`);
  const [title, setTitle] = useDraftText("home:task");

  // Each card is its own query: cached, refreshed on focus, and kept in sync with the To-do page
  // (tasks share the ["tasks"] key prefix, so a mutation anywhere updates every screen).
  const tasksQ = useQuery({
    queryKey: qk.tasks.home(today),
    queryFn: async () => {
      const { data, error } = await sb
        .from("tasks")
        .select("id,title,description,priority,list_id,due_date,done,done_at,cancelled,archived,recurrence,created_at")
        .or(`done.eq.false,due_date.eq.${today}`)
        .eq("cancelled", false)
        .eq("archived", false)
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(500);
      if (error) throw error;
      return data as Task[];
    },
  });
  const entriesQ = useQuery({
    queryKey: qk.journal.home(today),
    queryFn: async () => {
      const { data, error } = await sb
        .from("journal_entries")
        .select("id,body,created_at")
        .eq("entry_date", today)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data as { id: string; body: string; created_at: string }[];
    },
  });
  const chatsQ = useQuery({
    queryKey: qk.chats.recent,
    queryFn: async () => {
      const { data, error } = await sb.from("chats").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(4);
      if (error) throw error;
      return data as Chat[];
    },
  });
  const notesQ = useQuery({
    queryKey: qk.notes.home,
    queryFn: async () => {
      const { data, error } = await sb.from("notes").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(4);
      if (error) throw error;
      return data as Pick<Note, "id" | "title" | "updated_at">[];
    },
  });
  const profileQ = useQuery({
    queryKey: qk.profile,
    queryFn: async () => {
      const { data, error } = await sb.from("profiles").select("plan").maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? { plan: "free" };
    },
  });
  const calendarQ = useCalendarEvents();
  const feedsQ = useFeeds();
  const articlesQ = useArticles({ filter: "all", q: "" });
  const healthQ = useHealthDays(1);
  const invitesQ = useMyInvites();

  const tasks = tasksQ.data ?? EMPTY_TASKS;
  const entries = entriesQ.data ?? EMPTY_ENTRIES;
  const chats = chatsQ.data ?? EMPTY_CHATS;
  const notes = notesQ.data ?? EMPTY_NOTES;
  const profile = profileQ.data ?? { plan: "free" };
  const ready = !tasksQ.isPending && !entriesQ.isPending && !chatsQ.isPending;
  const loadFailed = tasksQ.isError || entriesQ.isError || chatsQ.isError || profileQ.isError;

  useRealtimeInvalidate("tasks", [qk.tasks.all]);
  useRealtimeInvalidate("chats", [qk.chats.all]);
  useRealtimeInvalidate("journal_entries", [qk.journal.all]);
  useRealtimeInvalidate("notes", [qk.notes.all]);

  const taskActions = useTaskActions(setErr, today);

  const addEntryMutation = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await sb.from("journal_entries").insert({ entry_date: today, body });
      if (error) throw error;
    },
    onError: (_e, body) => {
      setErr("Couldn’t save that entry.");
      setJournal(body);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.journal.all }),
  });

  function addEntry(e: React.FormEvent) {
    e.preventDefault();
    const body = journal.trim();
    if (!body) return;
    setJournal("");
    addEntryMutation.mutate(body);
  }

  const todays = tasks.filter((t) => t.due_date === today);
  const doneToday = todays.filter((t) => t.done).length;
  const pct = todays.length ? Math.round((doneToday / todays.length) * 100) : 0;
  const overdue = tasks.filter((t) => !t.done && t.due_date && t.due_date < today);
  const weekEnd = addDays(today, 7);
  const upcoming = tasks.filter((t) => !t.done && t.due_date && t.due_date > today && t.due_date <= weekEnd);
  const events = useMemo(() => groupEventsByDay(calendarQ.events).get(today) ?? [], [calendarQ.events, today]);
  const latest = (articlesQ.data?.pages[0]?.items ?? []).slice(0, 4);
  const unread = (feedsQ.data ?? []).reduce((sum, f) => sum + f.unread, 0);
  const health = healthQ.days.find((d) => d.day === today) ?? healthQ.days[0];
  const invites = invitesQ.data?.length ?? 0;

  // Same actions as the To-do page: ticking a task here also updates the To-do page's cache, and repeating tasks schedule their next run.
  const toggle = (t: Task) => taskActions.toggle(t);
  function add(e: React.FormEvent) {
    e.preventDefault();
    const v = title.trim();
    if (!v) return;
    setTitle("");
    taskActions.add({ title: v, description: "", due_date: today, priority: 4, list_id: null, recurrence: null });
  }
  const { layout, dragging, handleProps } = useHomeLayout();
  const drag = (id: string, label: string) => <DragHandle label={label} {...handleProps(id)} />;
  const first = name.split(" ")[0];
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const cards: Record<string, ReactNode> = {
    invites:
      invites > 0 ? (
        <Panel
          drag={drag("invites", "Shared journals")}
          icon={faUserGroup}
          title="Shared journals"
          href="/dashboard/journal/collaborate"
          className="max-[900px]:order-2"
        >
          <p className="m-0 text-[13.5px] text-fg-muted">
            {invites} {invites === 1 ? "invitation is" : "invitations are"} waiting for your answer.
          </p>
        </Panel>
      ) : null,
    today: (
      <section aria-label="Today" className="liquid-flat rounded-r3 p-[22px] [backdrop-filter:var(--glass-blur)] max-[700px]:p-4">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="m-0 font-serif text-[26px] leading-none font-normal tracking-[-0.02em]">Today</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] opacity-70 tabular-nums">
              {doneToday} of {todays.length} done
            </span>
            {drag("today", "Today")}
          </div>
        </div>
        <div
          className="mt-3 mb-4 h-1 overflow-hidden rounded-pill bg-line"
          role="progressbar"
          aria-label="Today’s progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <i className="block h-full rounded-pill bg-green-fg transition-[width] duration-300 ease-(--ease)" style={{ width: `${pct}%` }} />
        </div>

        <form
          onSubmit={add}
          className="mb-3 flex h-11 items-center gap-2.5 rounded-pill bg-surface-muted px-4 focus-within:bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-green-fg"
        >
          <FA icon={faPlus} className="text-[12px] text-fg-subtle" />
          <input
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-[14.5px] text-fg outline-none placeholder:text-fg-subtle"
            style={{ font: "inherit" }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task for today…"
            maxLength={300}
            aria-label="Add a task for today"
          />
        </form>

        {overdue.length > 0 && (
          <>
            <div className="mt-4 mb-1 text-[11px] font-semibold tracking-[0.1em] text-clay-fg uppercase">Overdue</div>
            <ul className="m-0 list-none p-0">
              {overdue.map((t) => (
                <TaskRow key={t.id} task={t} today={today} mode="overdue" onToggle={toggle} />
              ))}
            </ul>
          </>
        )}
        <ul className="m-0 list-none p-0">
          {todays.map((t) => (
            <TaskRow key={t.id} task={t} today={today} mode="today" onToggle={toggle} />
          ))}
        </ul>
        {ready && todays.length === 0 && overdue.length === 0 && <Empty>Nothing planned yet. Add the first thing above.</Empty>}
      </section>
    ),
    journal: (
      <Panel
        drag={drag("journal", "Today’s journal")}
        icon={faBookOpen}
        title="Today’s journal"
        href="/dashboard/journal"
        className="max-[900px]:order-3"
      >
        {entries.length > 0 && (
          <ul className="m-0 mb-3 flex list-none flex-col gap-1.5 p-0">
            {entries.map((en) => (
              <li key={en.id} className="flex gap-3 text-[13.5px]">
                <time className="shrink-0 text-fg-subtle tabular-nums">{fmtTime(en.created_at)}</time>
                <span className="line-clamp-2 text-fg-muted">{en.body || "Voice or attachment"}</span>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addEntry} className="flex items-end gap-2.5">
          <textarea
            className="max-h-40 min-h-[44px] flex-1 resize-none rounded-r2 border-0 bg-surface-muted px-4 py-3 text-[14.5px] text-fg placeholder:text-fg-subtle focus:bg-surface"
            style={{ font: "inherit" }}
            rows={1}
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") addEntry(e);
            }}
            maxLength={50000}
            placeholder={entries.length ? "Add another entry…" : "How is today going?"}
            aria-label="New journal entry"
            disabled={!ready}
          />
          <button className="btn btn-primary btn-sm" disabled={!journal.trim()}>
            Add
          </button>
        </form>
      </Panel>
    ),
    notes: (
      <Panel drag={drag("notes", "Notes")} icon={faPenToSquare} title="Notes" href="/dashboard/notes">
        {notes.length === 0 ? (
          <Empty>No notes yet</Empty>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {notes.map((n) => (
              <li key={n.id}>
                <Link
                  href="/dashboard/notes"
                  className="flex items-baseline justify-between gap-3 rounded-r1 px-2 py-2 text-[13.5px] hover:bg-surface-muted"
                >
                  <span className="truncate">{n.title || "Untitled"}</span>
                  <small className="shrink-0 text-fg-subtle">{ago(n.updated_at)}</small>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    ),
    chats: (
      <Panel drag={drag("chats", "Chats")} icon={faComments} title="Chats" href="/dashboard/chat">
        {ready && chats.length === 0 ? (
          <Empty>No chats yet</Empty>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {chats.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/chat?c=${c.id}`}
                  className="flex items-baseline justify-between gap-3 rounded-r1 px-2 py-2 text-[13.5px] hover:bg-surface-muted"
                >
                  <span className="truncate">{c.title}</span>
                  <small className="shrink-0 text-fg-subtle">{ago(c.updated_at)}</small>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    ),
    insights: <InsightsCard handle={drag("insights", "Personality insights")} />,
    schedule: (
      <Panel
        drag={drag("schedule", "Schedule")}
        icon={faCalendarDay}
        title="Schedule"
        href="/dashboard/calendar"
        hint="today"
        className="max-[900px]:order-2"
      >
        {events.length === 0 ? (
          <Empty>No events today</Empty>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {events.slice(0, 5).map((ev) => (
              <li key={ev.id} className="flex items-baseline gap-3 text-[13.5px]">
                <time className="w-[52px] shrink-0 text-fg-subtle tabular-nums">{ev.all_day ? "All day" : fmtTime(ev.start_at)}</time>
                <span className="truncate">{ev.title}</span>
              </li>
            ))}
          </ul>
        )}
        {upcoming.length > 0 && (
          <>
            <div className="mt-4 mb-1 text-[11px] font-semibold tracking-[0.1em] uppercase opacity-60">Due this week</div>
            <ul className="m-0 list-none p-0">
              {upcoming.slice(0, 4).map((t) => (
                <TaskRow key={t.id} task={t} today={today} mode="upcoming" onToggle={toggle} />
              ))}
            </ul>
          </>
        )}
      </Panel>
    ),
    reader: (
      <Panel
        drag={drag("reader", "Reader")}
        icon={faNewspaper}
        title="Reader"
        href="/dashboard/workspace/reader"
        hint={unread > 0 ? `${unread} unread` : undefined}
        className="max-[900px]:order-4"
      >
        {articlesQ.isPending ? (
          <Empty>Loading…</Empty>
        ) : latest.length === 0 ? (
          <Empty>No articles yet. Add a feed in the Reader.</Empty>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {latest.map((a) => (
              <li key={a.id}>
                <Link href="/dashboard/workspace/reader" className="block rounded-r1 px-2 py-2 hover:bg-surface-muted">
                  <span className="line-clamp-2 text-[13.5px] leading-snug text-fg">{a.title}</span>
                  <small className="mt-0.5 block truncate text-[12px] text-fg-subtle">
                    {a.feed_title} · {ago(a.published_at)}
                  </small>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    ),
    health: (
      <Panel
        drag={drag("health", "Health")}
        icon={faHeartPulse}
        title="Health"
        href="/dashboard/health"
        hint="today"
        className="max-[900px]:order-6"
      >
        {health && (health.steps !== null || health.sleep_minutes !== null) ? (
          <dl className="m-0 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[12px] text-fg-subtle">Steps</dt>
              <dd className="m-0 font-serif text-[26px] leading-tight tracking-[-0.02em]">{(health.steps ?? 0).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-fg-subtle">Sleep</dt>
              <dd className="m-0 font-serif text-[26px] leading-tight tracking-[-0.02em]">
                {health.sleep_minutes ? fmtDuration(health.sleep_minutes) : "–"}
              </dd>
            </div>
          </dl>
        ) : (
          <Empty>Connect Health on your phone to see steps and sleep.</Empty>
        )}
      </Panel>
    ),
  };
  /** One column of cards, each in a wrapper the drag code can measure. */
  const column = (col: HomeColumn) => (
    <div data-home-col={col} className="flex min-w-0 flex-col gap-[18px]">
      {layout[col].map((id) =>
        cards[id] ? (
          <div
            key={id}
            data-drag-id={id}
            data-dragging={dragging === id}
            className="rounded-r3 transition-[transform,box-shadow] duration-200 ease-(--ease) data-[dragging=true]:scale-[1.015] data-[dragging=true]:shadow-e3 motion-reduce:transition-none"
          >
            {cards[id]}
          </div>
        ) : null,
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1040px] pb-16 max-[700px]:pb-24">
      <header className="mb-6 mt-2 flex max-[700px]:mb-4 max-[700px]:flex-col max-[700px]:items-stretch flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="m-0 mb-1.5 text-[13.5px] text-fg-subtle">
            {date}
            <span className="at-green tint ml-2.5 rounded-pill px-2 py-[2px] align-middle text-[11px] font-semibold tracking-[0.08em] uppercase">
              {profile.plan}
            </span>
          </p>
          <h1 className="m-0 font-serif text-[clamp(30px,3.4vw,42px)] leading-[1.04] font-normal tracking-[-0.03em] text-balance">
            {greeting()}, <span className="text-green-fg italic">{first}</span>
          </h1>
        </div>
        <nav
          aria-label="Quick actions"
          className="flex flex-wrap gap-2 max-[700px]:-mx-3.5 max-[700px]:flex-nowrap max-[700px]:overflow-x-auto max-[700px]:px-3.5 max-[700px]:pb-1 max-[700px]:[scrollbar-width:none]"
        >
          {QUICK.map((q) => (
            <Link
              key={q.t}
              href={q.href}
              className="glass glass-hover inline-flex h-[38px] shrink-0 items-center gap-2 rounded-pill px-3.5 text-[13.5px] text-fg-muted transition-[transform,background-color,box-shadow] duration-300 ease-(--spring) hover:text-fg active:scale-95 motion-reduce:transition-none"
            >
              <FA icon={q.icon} className="text-[12px]" /> {q.t}
            </Link>
          ))}
        </nav>
      </header>

      {(err || loadFailed) && (
        <p className="form-err" role="alert">
          {err || "Couldn’t load your workspace. Make sure the database migration has been applied."}
        </p>
      )}

      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-[18px] max-[900px]:grid-cols-1">
        {column("main")}
        {column("side")}
      </div>
    </div>
  );
}
