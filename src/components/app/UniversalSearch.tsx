"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBookOpen,
  faCalendarDays,
  faCircleCheck,
  faComment,
  faComments,
  faGear,
  faHouse,
  faInbox,
  faListCheck,
  faMagnifyingGlass,
  faMessage,
  faPenToSquare,
  faPlus,
  faShieldHalved,
  faSpinner,
  faSquareCheck,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../lib/api/client";
import { displayTitle } from "../../lib/notes";
import { dayLabel, isoDate } from "../../lib/dates";
import Modal from "../ui/Modal";

export const OPEN_SEARCH_EVENT = "up:open-search";
export const OPEN_SETTINGS_EVENT = "up:open-settings";
/** Anything in the app can open universal search with `openSearch()`. */
export const openSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));

type Kind = "page" | "action" | "task" | "note" | "journal" | "chat" | "message";
type Hit = { id: string; kind: Kind; title: string; sub?: string; snippet?: string; icon: IconDefinition; run: () => void };

const GROUPS: [Kind[], string][] = [
  [["page", "action"], "Pages & actions"],
  [["task"], "Tasks"],
  [["note"], "Notes"],
  [["journal"], "Journal"],
  [["chat"], "Chats"],
  [["message"], "Messages"],
];

/** Make user text safe inside a PostgREST filter: drop the characters that have meaning there. */
const clean = (q: string) => q.replace(/[%_*\\,()"]/g, " ").trim();

function snippet(text: string, q: string) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text.slice(0, 90);
  const s = Math.max(0, i - 36);
  return `${s > 0 ? "…" : ""}${text.slice(s, i + q.length + 60).replace(/\s+/g, " ")}${i + q.length + 60 < text.length ? "…" : ""}`;
}

function Marked({ text, q }: { text: string; q: string }): ReactNode {
  const t = q.trim();
  if (!t) return text;
  const parts = text.split(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((p, i) => (p.toLowerCase() === t.toLowerCase() ? <mark key={i}>{p}</mark> : p));
}

export default function UniversalSearch({ admin }: { admin: boolean }) {
  const sb = useMemo(api, []);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [i, setI] = useState(0);
  const [mac, setMac] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const show = () => {
      setQ("");
      setI(0);
      setOpen(true);
    };
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) {
            setQ("");
            setI(0);
          }
          return !o;
        });
      }
    };
    window.addEventListener(OPEN_SEARCH_EVENT, show);
    document.addEventListener("keydown", key);
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, show);
      document.removeEventListener("keydown", key);
    };
  }, []);

  const close = () => setOpen(false);
  const go = (href: string) => () => {
    setOpen(false);
    router.push(href);
  };
  const event = (name: string) => () => {
    setOpen(false);
    window.dispatchEvent(new Event(name));
  };

  const pages: Hit[] = useMemo(() => {
    const p = (id: string, title: string, icon: IconDefinition, href: string, kind: Kind = "page", sub?: string): Hit => ({
      id,
      kind,
      title,
      icon,
      sub,
      run: go(href),
    });
    return [
      p("p-home", "Home", faHouse, "/dashboard"),
      p("p-journal", "Journal", faBookOpen, "/dashboard/journal"),
      p("p-chat", "Chat", faComments, "/dashboard/chat"),
      p("p-notes", "Notes", faPenToSquare, "/dashboard/notes"),
      p("p-todo", "To-do — Today", faListCheck, "/dashboard/todo?v=today"),
      p("p-inbox", "To-do — Inbox", faInbox, "/dashboard/todo?v=inbox"),
      p("p-up", "To-do — Upcoming", faCalendarDays, "/dashboard/todo?v=upcoming"),
      p("p-done", "To-do — Completed", faCircleCheck, "/dashboard/todo?v=completed"),
      p("a-task", "Add a task", faPlus, "/dashboard/todo?v=today&add=1", "action", "Quick add"),
      p("a-note", "New note", faPlus, "/dashboard/notes?new=1", "action"),
      p("a-chat", "New chat", faPlus, "/dashboard/chat?new=1", "action"),
      p("a-journal", "Write in today’s journal", faBookOpen, `/dashboard/journal?d=${isoDate()}`, "action"),
      { id: "a-settings", kind: "action", title: "Settings", icon: faGear, run: event(OPEN_SETTINGS_EVENT) },
      ...(admin ? [p("p-admin", "Admin panel", faShieldHalved, "/admin")] : []),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, open]);

  const term = clean(q);
  const matchedPages = useMemo(
    () => (term ? pages.filter((p) => p.title.toLowerCase().includes(term.toLowerCase())) : pages),
    [pages, term],
  );

  useEffect(() => {
    if (!open || term.length < 2) {
      setFound([]);
      setBusy(false);
      return;
    }
    const mine = ++seq.current;
    setBusy(true);
    const t = setTimeout(async () => {
      const p = `%${term}%`;
      const [tk, nt, jr, ch, ms] = await Promise.all([
        sb
          .from("tasks")
          .select("id,title,description,done,cancelled,archived,list_id,due_date")
          .or(`title.ilike."${p}",description.ilike."${p}"`)
          .order("created_at", { ascending: false })
          .limit(8),
        sb
          .from("notes")
          .select<{ id: string; title: string; body: string }>("id,title,body")
          .or(`title.ilike."${p}",body.ilike."${p}"`)
          .order("updated_at", { ascending: false })
          .limit(8),
        sb.from("journal_entries").select("id,entry_date,body").ilike("body", p).order("created_at", { ascending: false }).limit(8),
        sb.from("chats").select("id,title").ilike("title", p).order("updated_at", { ascending: false }).limit(6),
        sb.from("chat_messages").select("id,chat_id,body,chats(title)").ilike("body", p).order("created_at", { ascending: false }).limit(6),
      ]);
      if (mine !== seq.current) return; // a newer search has started
      const today = isoDate();
      const hits: Hit[] = [];
      (tk.data ?? []).forEach((r) => {
        const view = r.archived ? "archived" : r.cancelled ? "cancelled" : r.done ? "completed" : r.list_id ? `list:${r.list_id}` : "inbox";
        hits.push({
          id: `t${r.id}`,
          kind: "task",
          title: r.title,
          icon: faSquareCheck,
          sub: [
            r.done
              ? "Completed"
              : r.cancelled
                ? "Cancelled"
                : r.archived
                  ? "Archived"
                  : r.due_date
                    ? dayLabel(r.due_date, today)
                    : "No date",
          ].join(" · "),
          snippet: r.description && r.description.toLowerCase().includes(term.toLowerCase()) ? snippet(r.description, term) : undefined,
          run: go(`/dashboard/todo?v=${encodeURIComponent(view)}&task=${r.id}`),
        });
      });
      (nt.data ?? []).forEach((r) =>
        hits.push({
          id: `n${r.id}`,
          kind: "note",
          title: displayTitle(r),
          icon: faPenToSquare,
          snippet: snippet(r.body, term),
          run: go(`/dashboard/notes?note=${r.id}`),
        }),
      );
      (jr.data ?? []).forEach((r) =>
        hits.push({
          id: `j${r.id}`,
          kind: "journal",
          title: dayLabel(r.entry_date, today),
          icon: faBookOpen,
          snippet: snippet(r.body, term),
          run: go(`/dashboard/journal?d=${r.entry_date}`),
        }),
      );
      (ch.data ?? []).forEach((r) =>
        hits.push({ id: `c${r.id}`, kind: "chat", title: r.title, icon: faComment, run: go(`/dashboard/chat?c=${r.id}`) }),
      );
      (
        (ms.data ?? []) as unknown as { id: string; chat_id: string; body: string; chats: { title: string } | { title: string }[] | null }[]
      ).forEach((r) => {
        const title = Array.isArray(r.chats) ? r.chats[0]?.title : r.chats?.title;
        hits.push({
          id: `m${r.id}`,
          kind: "message",
          title: title ?? "Chat",
          icon: faMessage,
          snippet: snippet(r.body, term),
          run: go(`/dashboard/chat?c=${r.chat_id}`),
        });
      });
      setFound(hits);
      setBusy(false);
      setI(0);
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, open, sb]);

  const all = useMemo(() => [...matchedPages, ...found], [matchedPages, found]);
  const sections = GROUPS.map(([kinds, label]) => [label, all.filter((h) => kinds.includes(h.kind))] as const).filter(([, h]) => h.length);

  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [i]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setI((i + 1) % Math.max(all.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setI((i - 1 + all.length) % Math.max(all.length, 1));
    } else if (e.key === "Enter" && all[i]) {
      e.preventDefault();
      all[i].run();
    }
  };

  const kbd = mac ? "⌘K" : "Ctrl K";
  let n = -1;
  return (
    <>
      <button
        className="us-btn"
        aria-label={`Search everything (${kbd})`}
        title={`Search everything (${kbd})`}
        onClick={() => {
          setQ("");
          setI(0);
          setOpen(true);
        }}
      >
        <FA icon={faMagnifyingGlass} /> <span>Search</span> <kbd>{kbd}</kbd>
      </button>
      {open && (
        <Modal label="Search everything" onClose={close} top>
          <div className="us" onKeyDown={onKey}>
            <div className="us-in">
              <FA icon={busy ? faSpinner : faMagnifyingGlass} spin={busy} />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setI(0);
                }}
                placeholder="Search tasks, notes, journal, chats…"
                aria-label="Search everything"
                role="combobox"
                aria-expanded
                aria-controls="us-list"
                aria-autocomplete="list"
              />
              <kbd>Esc</kbd>
            </div>
            <ul id="us-list" role="listbox" aria-label="Results" ref={list}>
              {sections.map(([label, hits]) => (
                <li key={label} role="presentation" className="us-group">
                  <div className="us-h">{label}</div>
                  <ul role="presentation">
                    {hits.map((h) => {
                      const idx = ++n;
                      return (
                        <li
                          key={h.id}
                          role="option"
                          aria-selected={idx === i}
                          data-on={idx === i}
                          onMouseMove={() => setI(idx)}
                          onClick={h.run}
                        >
                          <span className="us-ico">
                            <FA icon={h.icon} />
                          </span>
                          <span className="us-t">
                            <b>
                              <Marked text={h.title} q={term} />
                            </b>
                            {(h.sub || h.snippet) && (
                              <small>
                                {h.sub}
                                {h.sub && h.snippet ? " — " : ""}
                                {h.snippet && <Marked text={h.snippet} q={term} />}
                              </small>
                            )}
                          </span>
                          {idx === i && <kbd>↵</kbd>}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
              {term.length >= 2 && !busy && sections.length === 0 && (
                <li className="us-none" role="presentation">
                  Nothing found for “{term}”.
                </li>
              )}
              {term.length === 1 && (
                <li className="us-none" role="presentation">
                  Keep typing to search your workspace…
                </li>
              )}
            </ul>
            <div className="us-foot">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> navigate
              </span>
              <span>
                <kbd>↵</kbd> open
              </span>
              <span>
                <kbd>Esc</kbd> close
              </span>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
