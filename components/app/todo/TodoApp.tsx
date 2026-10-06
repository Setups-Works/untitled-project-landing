"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faBars, faCheck, faCircleCheck, faEllipsis, faKeyboard, faMicrophone, faPen, faSliders, faTrash, faBoxArchive, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { supabaseBrowser } from "../../../lib/supabase/client";
import type { Task, TaskList } from "../../../lib/workspace";
import {
  DEFAULT_OPTS, VIEW_TITLES, emptyDraft, inView, isOpen, isView, nextDue, type Draft, type ViewKey, type ViewOpts,
} from "../../../lib/tasks";
import { isoDate } from "../../../lib/dates";
import { readPrefs } from "../../../lib/prefs";
import Menu from "../Menu";
import Modal from "../Modal";
import { useConfirm } from "../Confirm";
import Sidebar from "./Sidebar";
import ViewOptions from "./ViewOptions";
import TaskDialog from "./TaskDialog";
import { openSearch } from "../UniversalSearch";
import ShortcutsDialog from "./ShortcutsDialog";
import { BoardLayout, CalendarLayout, CompletedView, FiltersIndex, ListLayout, UpcomingView, type VCtx } from "./Views";

const COLS = "id,title,description,priority,list_id,due_date,done,done_at,cancelled,archived,recurrence,created_at";
const OPTS_KEY = "up_todo_opts";
const SIDE_KEY = "up_todo_sidebar";
const LAYOUT_VIEWS = ["inbox", "today", "overdue", "recurring"];

type Dialog = { mode: "add"; defaults: Partial<Draft> } | { mode: "edit"; task: Task } | null;
type SR = { lang: string; interimResults: boolean; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; start(): void; stop(): void };

const read = <T,>(key: string, fallback: T): T => {
  try { const v = window.localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
};
const write = (key: string, v: unknown) => { try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } };

export default function TodoApp() {
  const sb = useMemo(supabaseBrowser, []);
  const router = useRouter();
  const params = useSearchParams();
  const today = useMemo(() => isoDate(), []);
  const { ask, dialog: confirmDialog } = useConfirm();

  const raw = params.get("v");
  const view: ViewKey = isView(raw) ? raw : readPrefs().todoView;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [optsMap, setOptsMap] = useState<Record<string, ViewOpts>>(() => read(OPTS_KEY, {}));
  const [side, setSide] = useState<boolean>(() => read(SIDE_KEY, true));
  const [drawer, setDrawer] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [shortcuts, setShortcuts] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renaming, setRenaming] = useState<TaskList | null>(null);
  const [listening, setListening] = useState(false);
  const gAt = useRef(0);
  const rec = useRef<SR | null>(null);

  const list = view.startsWith("list:") ? lists.find((l) => l.id === view.slice(5)) : undefined;
  const opts = optsMap[view] ?? DEFAULT_OPTS;

  /* ---------- data ---------- */
  const load = useCallback(async () => {
    const [t, l] = await Promise.all([
      sb.from("tasks").select(COLS).order("created_at").limit(5000),
      sb.from("task_lists").select("id,name,color,created_at").order("created_at"),
    ]);
    setErr(t.error || l.error ? "Couldn’t load your tasks. Make sure the database migration has been applied." : "");
    setTasks((t.data as Task[]) ?? []);
    setLists((l.data as TaskList[]) ?? []);
    setReady(true);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  // Deep links from universal search: ?task=<id> opens that task, ?add=1 opens quick add.
  const taskParam = params.get("task");
  const addParam = params.get("add");
  useEffect(() => {
    if (!ready || (!taskParam && !addParam)) return;
    const found = taskParam ? tasks.find((t) => t.id === taskParam) : undefined;
    if (found) setDialog({ mode: "edit", task: found });
    else if (addParam) setDialog({ mode: "add", defaults: view === "today" ? { due_date: today } : {} });
    router.replace(`/dashboard/todo?v=${encodeURIComponent(view)}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, taskParam, addParam]);

  const go = useCallback((v: ViewKey) => { setDrawer(false); setSelected(new Set()); router.push(`/dashboard/todo?v=${encodeURIComponent(v)}`, { scroll: false }); }, [router]);

  const setOpts = (p: Partial<ViewOpts>) => {
    const next = { ...optsMap, [view]: { ...opts, ...p } };
    setOptsMap(next); write(OPTS_KEY, next);
  };
  const resetOpts = () => {
    const next = { ...optsMap }; delete next[view];
    setOptsMap(next); write(OPTS_KEY, next);
  };
  const toggleSide = useCallback(() => {
    if (window.matchMedia("(max-width: 900px)").matches) return setDrawer((d) => !d);
    setSide((s) => { write(SIDE_KEY, !s); return !s; });
  }, []);

  /* ---------- mutations ---------- */
  const patch = useCallback(async (id: string, p: Partial<Task>) => {
    setTasks((all) => all.map((t) => (t.id === id ? { ...t, ...p } : t)));
    const { error } = await sb.from("tasks").update(p).eq("id", id);
    if (error) { setErr("Couldn’t save that change."); load(); }
  }, [sb, load]);

  const add = useCallback(async (d: Draft) => {
    const { error } = await sb.from("tasks").insert({ title: d.title, description: d.description, due_date: d.due_date, priority: d.priority, list_id: d.list_id, recurrence: d.recurrence });
    if (error) setErr("Couldn’t add that task."); else await load();
  }, [sb, load]);

  const toggle = useCallback(async (t: Task) => {
    if (t.cancelled || t.archived) return;
    const done = !t.done;
    await patch(t.id, { done, done_at: done ? new Date().toISOString() : null });
    // Completing a repeating task schedules its next occurrence.
    if (done && t.recurrence && t.due_date) {
      await sb.from("tasks").insert({ title: t.title, description: t.description, due_date: nextDue(t.due_date, t.recurrence, today), priority: t.priority, list_id: t.list_id, recurrence: t.recurrence });
      load();
    }
  }, [patch, sb, load, today]);

  const removeTask = useCallback(async (t: Task): Promise<boolean> => {
    const yes = await ask({ title: "Delete this task?", body: <>“{t.title}” will be permanently deleted. This can’t be undone.</>, confirmLabel: "Delete task", danger: true });
    if (!yes) return false;
    setTasks((all) => all.filter((x) => x.id !== t.id));
    const { error } = await sb.from("tasks").delete().eq("id", t.id);
    if (error) { setErr("Couldn’t delete that task."); load(); }
    return true;
  }, [ask, sb, load]);

  const reschedule = useCallback(async (ids: string[], date: string) => {
    setTasks((all) => all.map((t) => (ids.includes(t.id) ? { ...t, due_date: date } : t)));
    const { error } = await sb.from("tasks").update({ due_date: date }).in("id", ids);
    if (error) { setErr("Couldn’t reschedule."); load(); }
  }, [sb, load]);

  const bulkComplete = async () => { for (const t of tasks.filter((x) => selected.has(x.id))) await toggle(t); setSelected(new Set()); };
  const bulkDelete = async () => {
    const ids = [...selected];
    const yes = await ask({ title: `Delete ${ids.length} tasks?`, body: "They’ll be permanently deleted. This can’t be undone.", confirmLabel: "Delete tasks", danger: true });
    if (!yes) return;
    setTasks((all) => all.filter((t) => !selected.has(t.id)));
    setSelected(new Set());
    const { error } = await sb.from("tasks").delete().in("id", ids);
    if (error) { setErr("Couldn’t delete those tasks."); load(); }
  };
  const archiveCompleted = async () => {
    const n = tasks.filter((t) => t.done && !t.archived).length;
    if (!n) return setErr("There are no completed tasks to archive.");
    const yes = await ask({ title: `Archive ${n} completed ${n === 1 ? "task" : "tasks"}?`, body: "You can still find them under Filters → Archived.", confirmLabel: "Archive" });
    if (!yes) return;
    const { error } = await sb.from("tasks").update({ archived: true }).eq("done", true).eq("archived", false);
    if (error) setErr("Couldn’t archive tasks."); else load();
  };

  const addList = async (name: string, color: string) => {
    const { data, error } = await sb.from("task_lists").insert({ name, color }).select("id,name,color,created_at").single();
    if (error || !data) return setErr("Couldn’t create that list.");
    setLists((l) => [...l, data as TaskList]);
    go(`list:${data.id}`);
  };
  const renameList = async (l: TaskList, name: string) => {
    setLists((all) => all.map((x) => (x.id === l.id ? { ...x, name } : x)));
    const { error } = await sb.from("task_lists").update({ name }).eq("id", l.id);
    if (error) { setErr("Couldn’t rename that list."); load(); }
  };
  const deleteList = async (l: TaskList) => {
    const yes = await ask({ title: "Delete this list?", body: <>“{l.name}” will be deleted. Its tasks aren’t lost — they move to your Inbox.</>, confirmLabel: "Delete list", danger: true });
    if (!yes) return;
    const { error } = await sb.from("task_lists").delete().eq("id", l.id);
    if (error) return setErr("Couldn’t delete that list.");
    setLists((all) => all.filter((x) => x.id !== l.id));
    setTasks((all) => all.map((t) => (t.list_id === l.id ? { ...t, list_id: null } : t)));
    go("inbox");
  };

  /* ---------- derived ---------- */
  const counts = useMemo(() => {
    const open = tasks.filter(isOpen);
    const byList: Record<string, number> = {};
    open.forEach((t) => { if (t.list_id) byList[t.list_id] = (byList[t.list_id] || 0) + 1; });
    return {
      inbox: open.filter((t) => !t.list_id).length,
      today: open.filter((t) => t.due_date && t.due_date <= today).length,
      lists: byList,
    };
  }, [tasks, today]);

  const viewTasks = useMemo(() => tasks.filter((t) => inView(t, view, today, opts.showCompleted)), [tasks, view, today, opts.showCompleted]);
  const defaults: Partial<Draft> = view === "today" ? { due_date: today } : list ? { list_id: list.id } : {};
  const title = list?.name ?? VIEW_TITLES[view] ?? "Tasks";
  const openCount = viewTasks.filter(isOpen).length;
  const layout = LAYOUT_VIEWS.includes(view) || list ? opts.layout : "list";
  const tone = list?.color ?? (view === "overdue" ? "clay" : view === "recurring" ? "violet" : view === "today" ? "amber" : "sand");

  const ctx: VCtx = {
    today, lists, selected,
    onToggle: toggle,
    onOpen: (t) => setDialog({ mode: "edit", task: t }),
    onDelete: removeTask,
    onSelect: (t) => setSelected((s) => { const n = new Set(s); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); return n; }),
    onAdd: add,
    onReschedule: reschedule,
    onGo: go,
  };

  /* ---------- voice quick-add ---------- */
  const Speech = typeof window !== "undefined" ? ((window as unknown as Record<string, new () => SR>).SpeechRecognition ?? (window as unknown as Record<string, new () => SR>).webkitSpeechRecognition) : undefined;
  const dictate = () => {
    if (listening) return rec.current?.stop();
    if (!Speech) return;
    const r = new Speech();
    r.lang = navigator.language;
    r.interimResults = false;
    r.onresult = (e) => { const text = e.results[0]?.[0]?.transcript?.trim(); if (text) setDialog({ mode: "add", defaults: { ...defaults, title: text } }); };
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    try { r.start(); } catch { setListening(false); }
  };

  /* ---------- keyboard shortcuts ---------- */
  const latest = useRef({ view, defaults, tasks, go, toggleSide, patch });
  latest.current = { view, defaults, tasks, go, toggleSide, patch };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.matches?.("input, textarea, select, [contenteditable=true]");
      const modal = !!document.querySelector(".tm-back, .cd-back, .sm-back");
      const L = latest.current;
      if (e.key === "Escape") { setViewOpen(false); if (!modal) setSelected(new Set()); return; }
      if (typing || modal || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (Date.now() - gAt.current < 1000) {
        gAt.current = 0;
        const dest: Record<string, ViewKey> = { t: "today", u: "upcoming", i: "inbox", f: "filters" };
        if (dest[k]) { e.preventDefault(); L.go(dest[k]); return; }
      }
      const rowId = (document.activeElement as HTMLElement | null)?.closest?.("[data-task-id]")?.getAttribute("data-task-id");
      const row = rowId ? L.tasks.find((t) => t.id === rowId) : undefined;
      if (k === "g") { gAt.current = Date.now(); return; }
      if (k === "q" || k === "a") { e.preventDefault(); setDialog({ mode: "add", defaults: L.defaults }); return; }
      if (k === "m") { e.preventDefault(); L.toggleSide(); return; }
      if (k === "/") { e.preventDefault(); openSearch(); return; }
      if (k === "?") { e.preventDefault(); setShortcuts(true); return; }
      if ((k === "e" || k === "t") && row) { e.preventDefault(); setDialog({ mode: "edit", task: row }); return; }
      if (/^[1-4]$/.test(k) && row) { e.preventDefault(); L.patch(row.id, { priority: Number(k) as Task["priority"] }); return; }
      if (k === "arrowdown" || k === "arrowup") {
        const rows = [...document.querySelectorAll<HTMLElement>("[data-task-row]")];
        if (!rows.length) return;
        e.preventDefault();
        const i = rows.findIndex((r) => r === document.activeElement);
        rows[Math.max(0, Math.min(rows.length - 1, i + (k === "arrowdown" ? 1 : -1)))]?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- render ---------- */
  const body = () => {
    if (!ready) return <p className="ap-none">Loading your tasks…</p>;
    if (view === "filters") return <FiltersIndex tasks={tasks} today={today} onGo={go} />;
    if (view === "upcoming") return <UpcomingView tasks={tasks} ctx={ctx} today={today} />;
    if (view === "completed") return <CompletedView tasks={tasks} lists={lists} ctx={ctx} today={today} />;
    if (layout === "board") return <BoardLayout tasks={viewTasks} opts={opts} lists={lists} ctx={ctx} today={today} defaults={defaults} />;
    if (layout === "calendar") return <CalendarLayout tasks={viewTasks} opts={opts} ctx={ctx} today={today} onAddOn={(d) => setDialog({ mode: "add", defaults: { ...defaults, due_date: d } })} />;
    return <ListLayout view={view} tasks={viewTasks} opts={opts} lists={lists} ctx={ctx} today={today} defaults={defaults} tone={tone} />;
  };

  const toDraft = (t: Task): Draft => ({ title: t.title, description: t.description, due_date: t.due_date, priority: t.priority, list_id: t.list_id, recurrence: t.recurrence });
  const showSide = side;

  return (
    <div className="tdo" data-side={showSide} data-drawer={drawer}>
      {confirmDialog}
      {drawer && <div className="tdo-scrim" onClick={() => setDrawer(false)} />}
      <div className="tdo-sidewrap">
        <Sidebar
          view={view}
          lists={lists}
          counts={counts}
          onGo={go}
          onAdd={() => setDialog({ mode: "add", defaults })}
          onSearch={openSearch}
          onAddList={addList}
          onCollapse={toggleSide}
        />
      </div>

      <main className="tdo-main">
        <header className="tdo-head">
          <button className="ne-btn tdo-menu" aria-label="Show sidebar" title="Show sidebar (M)" data-show={!showSide} onClick={toggleSide}><FA icon={faBars} /></button>
          <div className="tdo-title">
            <h1 className="h2">{list && <i className={`at-${list.color}`} aria-hidden />}{title}</h1>
            {ready && !["filters", "upcoming", "completed"].includes(view) && layout === "list" && (
              <small><FA icon={faCircleCheck} /> {openCount} {openCount === 1 ? "task" : "tasks"}</small>
            )}
          </div>
          <div className="tdo-tools">
            <button className="ne-btn" aria-label={listening ? "Stop listening" : "Add a task by voice"} title={Speech ? "Add a task by voice" : "Voice input isn’t supported in this browser"} data-on={listening} disabled={!Speech} onClick={dictate}><FA icon={faMicrophone} /></button>
            <div className="tdo-view">
              <button className="tdo-viewbtn" aria-haspopup="dialog" aria-expanded={viewOpen} data-on={viewOpen} onClick={() => setViewOpen(!viewOpen)}><FA icon={faSliders} /> <span>View</span></button>
              {viewOpen && <ViewOptions opts={opts} onChange={setOpts} onReset={resetOpts} onClose={() => setViewOpen(false)} layouts={LAYOUT_VIEWS.includes(view) || !!list} />}
            </div>
            <Menu label="More options" trigger={<FA icon={faEllipsis} />} className="tdo-more">
              {(close) => (
                <>
                  <button role="menuitem" onClick={() => { close(); setShortcuts(true); }}><span><FA icon={faKeyboard} /> Keyboard shortcuts</span></button>
                  <button role="menuitem" onClick={() => { close(); archiveCompleted(); }}><span><FA icon={faBoxArchive} /> Archive completed tasks</span></button>
                  {list && (
                    <>
                      <hr />
                      <button role="menuitem" onClick={() => { close(); setRenaming(list); }}><span><FA icon={faPen} /> Rename list</span></button>
                      <button role="menuitem" className="danger" onClick={() => { close(); deleteList(list); }}><span><FA icon={faTrash} /> Delete list</span></button>
                    </>
                  )}
                </>
              )}
            </Menu>
          </div>
        </header>

        {err && <p className="form-err" role="alert">{err}</p>}
        <div className="tdo-body">{body()}</div>
      </main>

      {selected.size > 0 && (
        <div className="tdo-bulk" role="toolbar" aria-label="Selected tasks">
          <b>{selected.size} selected</b>
          <button className="btn btn-secondary btn-sm" onClick={bulkComplete}><FA icon={faCheck} /> Complete</button>
          <button className="btn btn-secondary btn-sm" onClick={bulkDelete}><FA icon={faTrash} /> Delete</button>
          <button className="ne-btn" aria-label="Clear selection" onClick={() => setSelected(new Set())}><FA icon={faXmark} /></button>
        </div>
      )}

      {dialog && (
        <TaskDialog
          key={dialog.mode === "edit" ? dialog.task.id : "new"}
          task={dialog.mode === "edit" ? dialog.task : null}
          initial={dialog.mode === "edit" ? toDraft(dialog.task) : emptyDraft(dialog.defaults)}
          lists={lists}
          onClose={() => setDialog(null)}
          onSave={async (d) => {
            if (dialog.mode === "edit") await patch(dialog.task.id, { title: d.title, description: d.description, due_date: d.due_date, priority: d.priority, list_id: d.list_id, recurrence: d.recurrence });
            else await add(d);
          }}
          onToggle={toggle}
          onCancelTask={(t) => patch(t.id, { cancelled: !t.cancelled, ...(t.cancelled ? {} : { done: false, done_at: null }) })}
          onArchive={(t) => patch(t.id, { archived: !t.archived })}
          onDelete={async (t) => { if (await removeTask(t)) setDialog(null); }}
        />
      )}
      {shortcuts && <ShortcutsDialog onClose={() => setShortcuts(false)} />}
      {renaming && (
        <Modal label="Rename list" onClose={() => setRenaming(null)} size="sm">
          <form className="td" onSubmit={(e) => { e.preventDefault(); const n = String(new FormData(e.currentTarget).get("name") || "").trim(); if (n) { renameList(renaming, n); setRenaming(null); } }}>
            <div className="td-head"><h2 className="h3">Rename list</h2><button type="button" className="ne-btn" aria-label="Close" onClick={() => setRenaming(null)}><FA icon={faXmark} /></button></div>
            <input className="tf-title" name="name" defaultValue={renaming.name} maxLength={60} autoFocus aria-label="List name" />
            <div className="tf-acts"><button type="button" className="btn btn-secondary btn-sm" onClick={() => setRenaming(null)}>Cancel</button><button className="btn btn-primary btn-sm">Save</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
