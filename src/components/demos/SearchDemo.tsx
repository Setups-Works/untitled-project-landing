"use client";
import { useMemo, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faPenToSquare,
  faListCheck,
  faEnvelope,
  faCalendarDays,
  faMicrophone,
  faBookOpen,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";

const TYPES = {
  Notes: { icon: faPenToSquare, tone: "blue" },
  Tasks: { icon: faListCheck, tone: "amber" },
  Email: { icon: faEnvelope, tone: "green" },
  Calendar: { icon: faCalendarDays, tone: "gold" },
  Meetings: { icon: faMicrophone, tone: "clay" },
  Journal: { icon: faBookOpen, tone: "violet" },
  Docs: { icon: faFileLines, tone: "blue" },
} as const;
type T = keyof typeof TYPES;

const DATA: { type: T; title: string; snippet: string; meta: string }[] = [
  {
    type: "Notes",
    title: "Launch plan, v3",
    snippet: "Timeline, owners and the pricing decision for the launch.",
    meta: "Edited yesterday",
  },
  { type: "Tasks", title: "Review pricing page with team", snippet: "Linked to Launch plan, v3 · due Thursday", meta: "Open" },
  {
    type: "Email",
    title: "Re: Q3 roadmap review",
    snippet: "Shared the draft — thoughts on scope before the launch?",
    meta: "Gmail · 4 messages",
  },
  { type: "Calendar", title: "Launch review", snippet: "11:00 · Google Meet · with Maya, Dev and Priya", meta: "Today" },
  {
    type: "Meetings",
    title: "Launch review — transcript",
    snippet: "Let’s lock pricing by Thursday and send the recap.",
    meta: "Captured",
  },
  {
    type: "Journal",
    title: "A good, busy day",
    snippet: "Shipped the first draft of the launch plan. Pricing unblocked everyone.",
    meta: "Fri 2 Oct",
  },
  {
    type: "Docs",
    title: "Pricing page copy",
    snippet: "Revised copy for sign-off — launch announcement draft attached.",
    meta: "Google Docs",
  },
  { type: "Notes", title: "Reading list", snippet: "Articles clipped from the web, tagged for later.", meta: "Web clipper" },
];

function mark(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function SearchDemo() {
  const [q, setQ] = useState("launch");
  const [f, setF] = useState<T | "All">("All");
  const res = useMemo(
    () => DATA.filter((d) => (f === "All" || d.type === f) && (!q || (d.title + " " + d.snippet).toLowerCase().includes(q.toLowerCase()))),
    [q, f],
  );
  return (
    <div className="sdemo">
      <label className="sdemo-box">
        <FA icon={faMagnifyingGlass} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes, tasks, mail, meetings…" aria-label="Search" />
        {q && (
          <button onClick={() => setQ("")} aria-label="Clear search">
            Clear
          </button>
        )}
      </label>
      <div className="sdemo-chips" role="tablist" aria-label="Filter by type">
        {(["All", ...Object.keys(TYPES)] as (T | "All")[]).map((t) => (
          <button key={t} role="tab" aria-selected={f === t} className="tab" onClick={() => setF(t)}>
            {t}
          </button>
        ))}
      </div>
      <ul className="sdemo-list">
        {res.map((r) => (
          <li key={r.title} className={`sdemo-item at-${TYPES[r.type].tone}`}>
            <span className="sdemo-ico">
              <FA icon={TYPES[r.type].icon} />
            </span>
            <span className="sdemo-body">
              <b>{mark(r.title, q)}</b>
              <small>{mark(r.snippet, q)}</small>
            </span>
            <span className="sdemo-meta">
              {r.type} · {r.meta}
            </span>
          </li>
        ))}
        {res.length === 0 && <li className="sdemo-empty">Nothing matches “{q}”. Try “pricing” or “roadmap”.</li>}
      </ul>
      <p className="meta" style={{ textAlign: "center", marginTop: 12 }}>
        Sample data for illustration.
      </p>
    </div>
  );
}
