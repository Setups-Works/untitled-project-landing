"use client";
import { useState } from "react";

type N = { id: string; label: string; kind: string; x: number; y: number; tone: string };
const NODES: N[] = [
  { id: "plan", label: "Launch plan, v3", kind: "Note", x: 50, y: 48, tone: "blue" },
  { id: "mail", label: "Q3 roadmap thread", kind: "Email", x: 16, y: 20, tone: "green" },
  { id: "meet", label: "Launch review", kind: "Meeting", x: 84, y: 22, tone: "clay" },
  { id: "task", label: "Review pricing page", kind: "Task", x: 18, y: 78, tone: "amber" },
  { id: "day", label: "Fri 2 Oct", kind: "Journal", x: 82, y: 80, tone: "violet" },
  { id: "doc", label: "Pricing page copy", kind: "Doc", x: 50, y: 10, tone: "blue" },
];
const EDGES: [string, string][] = [
  ["plan", "mail"],
  ["plan", "meet"],
  ["plan", "task"],
  ["plan", "day"],
  ["plan", "doc"],
  ["meet", "task"],
  ["mail", "doc"],
  ["meet", "day"],
];
const WHY: Record<string, string> = {
  "plan-mail": "Mentioned in the thread",
  "plan-meet": "Discussed in the meeting",
  "plan-task": "Task linked from the note",
  "plan-day": "Referenced in your journal",
  "plan-doc": "Backlink to the doc",
  "meet-task": "Action item from the meeting",
  "mail-doc": "Attachment in the thread",
  "meet-day": "Written up in your journal",
};

export default function GraphDemo() {
  const [sel, setSel] = useState("plan");
  const linked = (a: string, b: string) => EDGES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const cur = NODES.find((n) => n.id === sel)!;
  const conns = EDGES.filter(([a, b]) => a === sel || b === sel).map(([a, b]) => {
    const other = NODES.find((n) => n.id === (a === sel ? b : a))!;
    return { other, why: WHY[`${a}-${b}`] };
  });
  const get = (id: string) => NODES.find((n) => n.id === id)!;
  return (
    <div className="gdemo">
      <div className="gdemo-stage">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {EDGES.map(([a, b]) => {
            const on = a === sel || b === sel;
            return (
              <line
                key={a + b}
                x1={get(a).x}
                y1={get(a).y}
                x2={get(b).x}
                y2={get(b).y}
                stroke={on ? "#1f5d49" : "#1b1c1433"}
                strokeWidth={on ? 2 : 1.2}
                vectorEffect="non-scaling-stroke"
                strokeDasharray={on ? "0" : "4 4"}
              />
            );
          })}
        </svg>
        {NODES.map((n) => {
          const dim = n.id !== sel && !linked(sel, n.id);
          return (
            <button
              key={n.id}
              className={`gnode at-${n.tone}`}
              data-on={n.id === sel}
              data-dim={dim}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              onClick={() => setSel(n.id)}
              aria-pressed={n.id === sel}
            >
              <small>{n.kind}</small>
              {n.label}
            </button>
          );
        })}
      </div>
      <aside className="gdemo-side">
        <div className="eyebrow">Selected · {cur.kind}</div>
        <h3 className="h3" style={{ margin: "8px 0 14px" }}>
          {cur.label}
        </h3>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          {conns.length} connections
        </div>
        <ul>
          {conns.map((c) => (
            <li key={c.other.id}>
              <button onClick={() => setSel(c.other.id)}>
                <b>{c.other.label}</b>
                <small>
                  {c.other.kind} · {c.why}
                </small>
              </button>
            </li>
          ))}
        </ul>
        <p className="meta" style={{ marginTop: 12 }}>
          Sample data for illustration. Click any node.
        </p>
      </aside>
    </div>
  );
}
