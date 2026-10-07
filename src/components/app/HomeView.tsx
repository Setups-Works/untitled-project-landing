"use client";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faBookOpen, faComments, faPenToSquare, faListCheck, faPlus, faMessage } from "@fortawesome/free-solid-svg-icons";
import { supabaseBrowser } from "../../lib/supabase/client";
import { qk } from "../../lib/query/keys";
import { useRealtimeInvalidate } from "../../hooks/useRealtimeInvalidate";
import { useTaskActions } from "../../features/tasks/queries";
import { addDays, ago, greeting, isoDate } from "../../lib/dates";
import type { Chat, Profile, Task } from "../../lib/workspace";
import { fmtTime } from "../../lib/prefs";
import TaskRow from "./TaskRow";
import InsightsCard from "./InsightsCard";

// Stable empty values so a still-loading query doesn't create a new array on every render.
const EMPTY_TASKS: Task[] = [];
const EMPTY_CHATS: Chat[] = [];
const EMPTY_ENTRIES: { id: string; body: string; created_at: string }[] = [];

const QUICK = [
  { href: "/dashboard/todo", t: "Plan my day", icon: faListCheck },
  { href: "/dashboard/journal", t: "Write today’s journal", icon: faBookOpen },
  { href: "/dashboard/notes?new=1", t: "Capture a note", icon: faPenToSquare },
  { href: "/dashboard/chat?new=1", t: "Start a chat", icon: faComments },
];

export default function HomeView({ name }: { name: string }) {
  const sb = useMemo(supabaseBrowser, []);
  const qc = useQueryClient();
  const today = useMemo(() => isoDate(), []);
  const [err, setErr] = useState("");
  const [journal, setJournal] = useState("");
  const [title, setTitle] = useState("");

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
      const { data, error } = await sb.from("chats").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data as Chat[];
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
  const tasks = tasksQ.data ?? EMPTY_TASKS;
  const entries = entriesQ.data ?? EMPTY_ENTRIES;
  const chats = chatsQ.data ?? EMPTY_CHATS;
  const profile = profileQ.data ?? { plan: "free" };
  const ready = !tasksQ.isPending && !entriesQ.isPending && !chatsQ.isPending;
  const loadFailed = tasksQ.isError || entriesQ.isError || chatsQ.isError || profileQ.isError;

  useRealtimeInvalidate("tasks", [qk.tasks.all]);
  useRealtimeInvalidate("chats", [qk.chats.all]);
  useRealtimeInvalidate("journal_entries", [qk.journal.all]);

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

  // Same actions as the To-do page: ticking a task here also updates the To-do page's cache, and repeating tasks schedule their next run.
  const toggle = (t: Task) => taskActions.toggle(t);
  function add(e: React.FormEvent) {
    e.preventDefault();
    const v = title.trim();
    if (!v) return;
    setTitle("");
    taskActions.add({ title: v, description: "", due_date: today, priority: 4, list_id: null, recurrence: null });
  }
  const first = name.split(" ")[0];
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="ap-home">
      <div className="ap-greet">
        <h1 className="h2">
          {greeting()}, <span className="quiet">{first}</span> <em className="ap-plan">{profile.plan}</em>
        </h1>
        <small className="meta">{date}</small>
      </div>

      <div className="ap-quick">
        {QUICK.map((q) => (
          <Link key={q.t} href={q.href}>
            <FA icon={q.icon} /> {q.t}
          </Link>
        ))}
      </div>

      {(err || loadFailed) && (
        <p className="form-err" role="alert">
          {err || "Couldn’t load your workspace. Make sure the database migration has been applied."}
        </p>
      )}

      <div className="ap-grid">
        <div className="ap-col">
          <section aria-label="Today’s progress">
            <div className="ap-prog">
              <span>
                {doneToday} of {todays.length} tasks done today
              </span>
              <b>{pct}%</b>
            </div>
            <div className="ap-bar-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
              <i style={{ width: `${pct}%` }} />
            </div>
            <form className="ap-add" onSubmit={add}>
              <FA icon={faPlus} />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a task for today…"
                maxLength={300}
                aria-label="Add a task for today"
              />
            </form>
          </section>

          <section className="ap-card at-amber">
            <div className="ap-card-h">
              <span>Focus</span>
              <small>
                {overdue.length} overdue · {todays.filter((t) => !t.done).length} today
              </small>
            </div>
            <div className="ap-sec" data-k="overdue">
              Overdue
            </div>
            <ul>
              {overdue.map((t) => (
                <TaskRow key={t.id} task={t} today={today} mode="overdue" onToggle={toggle} />
              ))}
            </ul>
            {ready && overdue.length === 0 && <p className="ap-none">Nothing overdue. Nice.</p>}
            <div className="ap-sec">Today</div>
            <ul>
              {todays.map((t) => (
                <TaskRow key={t.id} task={t} today={today} mode="today" onToggle={toggle} />
              ))}
            </ul>
            {ready && todays.length === 0 && <p className="ap-none">No tasks for today</p>}
          </section>

          <div className="ap-two">
            <section className="ap-card at-violet">
              <div className="ap-card-h">
                <span>Today’s journal</span>
                <small>
                  {entries.length
                    ? `${entries.length}${entries.length === 3 ? "+" : ""} ${entries.length === 1 ? "entry" : "entries"}`
                    : ""}
                </small>
              </div>
              {entries.length > 0 && (
                <ul className="ap-jlist">
                  {entries.map((en) => (
                    <li key={en.id}>
                      <time>{fmtTime(en.created_at)}</time>
                      <span>{en.body || "Voice or attachment"}</span>
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={addEntry}>
                <textarea
                  className="ap-journal"
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") addEntry(e);
                  }}
                  maxLength={50000}
                  placeholder={entries.length ? "Add another entry…" : "Write your first entry for today…"}
                  aria-label="New journal entry"
                  disabled={!ready}
                />
                <button className="btn btn-primary btn-sm ap-jadd" disabled={!journal.trim()}>
                  Add entry
                </button>
              </form>
              <Link className="ap-foot" href="/dashboard/journal">
                Open journal →
              </Link>
            </section>
            <section className="ap-card at-blue">
              <div className="ap-card-h">
                <span>
                  <FA icon={faMessage} /> Recent chats
                </span>
              </div>
              <ul className="ap-chats">
                {chats.map((c) => (
                  <li key={c.id}>
                    <Link href={`/dashboard/chat?c=${c.id}`}>
                      <span>{c.title}</span>
                      <small>{ago(c.updated_at)}</small>
                    </Link>
                  </li>
                ))}
              </ul>
              {ready && chats.length === 0 && <p className="ap-none">No chats yet</p>}
              <Link className="ap-foot" href="/dashboard/chat?new=1">
                + New chat
              </Link>
            </section>
          </div>
        </div>

        <div className="ap-col">
          <section className="ap-card at-mint">
            <div className="ap-card-h">
              <span>Upcoming</span>
            </div>
            {ready && upcoming.length === 0 && <p className="ap-none">No tasks for the next 7 days</p>}
            <ul>
              {upcoming.map((t) => (
                <TaskRow key={t.id} task={t} today={today} mode="upcoming" onToggle={toggle} />
              ))}
            </ul>
          </section>
          <InsightsCard />
        </div>
      </div>
    </div>
  );
}
