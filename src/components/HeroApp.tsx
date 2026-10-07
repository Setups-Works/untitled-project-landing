"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faBookOpen,
  faPenToSquare,
  faListCheck,
  faEnvelope,
  faCalendarDays,
  faMicrophone,
  faDiagramProject,
  faCheck,
  faReply,
  faPaperclip,
  faCircleDot,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";

const NAV = [
  { id: "home", t: "Home", i: faHouse },
  { id: "journal", t: "Journal", i: faBookOpen },
  { id: "notes", t: "Notes", i: faPenToSquare },
  { id: "todo", t: "To-do", i: faListCheck },
  { id: "email", t: "Email", i: faEnvelope },
  { id: "calendar", t: "Calendar", i: faCalendarDays },
  { id: "meetings", t: "Meetings", i: faMicrophone },
  { id: "automations", t: "Automations", i: faDiagramProject },
] as const;
type Id = (typeof NAV)[number]["id"];

const TODAY = [
  { t: "Stand-up", s: "9:30 · Google Meet", c: "green" },
  { t: "Launch review", s: "11:00 · Zoom", c: "amber" },
  { t: "Personal · Dentist", s: "16:30", c: "violet" },
];

export default function HeroApp() {
  const [view, setView] = useState<Id>("notes");
  const [auto, setAuto] = useState(true);
  const [tasks, setTasks] = useState([
    { t: "Draft announcement", d: true },
    { t: "Review pricing page with team", d: false },
    { t: "Send recap to #launch on Slack", d: false },
  ]);
  const [rules, setRules] = useState([
    { t: "Post meeting recap to Slack", s: "When a meeting ends", on: true },
    {
      t: "Draft follow-up in Outlook",
      s: "When a meeting has action items",
      on: true,
    },
    {
      t: "Log CRM activity in HubSpot",
      s: "When a deal email arrives",
      on: false,
    },
  ]);
  const [mail, setMail] = useState(0);

  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const order: Id[] = [
      "notes",
      "todo",
      "email",
      "calendar",
      "meetings",
      "automations",
      "journal",
      "home",
    ];
    const t = setInterval(
      () => setView((v) => order[(order.indexOf(v) + 1) % order.length]),
      4200,
    );
    return () => clearInterval(t);
  }, [auto]);

  const toggleTask = (k: number) =>
    setTasks((a) => a.map((x, n) => (n === k ? { ...x, d: !x.d } : x)));
  const done = tasks.filter((x) => x.d).length;
  const Tasks = ({ title }: { title: string }) => (
    <>
      <div className="eyebrow app-sec">
        {title} · {done}/{tasks.length}
      </div>
      {tasks.map((x, k) => (
        <button
          key={x.t}
          className={`app-todo${x.d ? " done" : ""}`}
          onClick={() => toggleTask(k)}
          aria-pressed={x.d}
        >
          <b>{x.d && <FA icon={faCheck} />}</b>
          <span>{x.t}</span>
        </button>
      ))}
    </>
  );

  const MAILS = [
    {
      f: "Maya",
      s: "Re: Q3 roadmap review",
      p: "Shared the draft — thoughts on scope?",
      a: "Gmail",
    },
    {
      f: "Dev",
      s: "Launch checklist",
      p: "Can we move the review to Thursday?",
      a: "Gmail",
    },
    {
      f: "Priya",
      s: "Pricing page copy",
      p: "Attached the revised copy for sign-off.",
      a: "Outlook",
    },
  ];

  return (
    <div className="app" onPointerDown={() => setAuto(false)}>
      <div className="app-bar">
        <i />
        <i />
        <i />
        <span>untitled project</span>
      </div>
      <div className="app-body">
        <nav className="app-side" aria-label="App preview">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={view === n.id ? "on" : ""}
              onClick={() => {
                setView(n.id);
                setAuto(false);
              }}
              aria-pressed={view === n.id}
            >
              <FA icon={n.i} />
              <span>{n.t}</span>
            </button>
          ))}
        </nav>

        <div className="app-main" key={view}>
          {view === "home" && (
            <>
              <div className="eyebrow">Home</div>
              <h4>Good morning</h4>
              <p className="app-p">Here’s your workspace at a glance.</p>
              <div className="app-stats">
                {[
                  ["3", "events today"],
                  [`${tasks.length - done}`, "open tasks"],
                  ["4", "unread threads"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <b>{n}</b>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
              <div className="app-line" style={{ width: "88%" }} />
              <div className="app-line" style={{ width: "64%" }} />
            </>
          )}
          {view === "journal" && (
            <>
              <div className="eyebrow">Journal · Fri 2 Oct</div>
              <h4>A good, busy day</h4>
              <p className="app-p">
                Shipped the first draft of the launch plan. Stand-up went long,
                but the pricing discussion unblocked everyone.
              </p>
              <div className="app-line" style={{ width: "92%" }} />
              <div className="app-line" style={{ width: "70%" }} />
              <div className="app-chips">
                <span>focused</span>
                <span>grateful</span>
                <span>tired</span>
              </div>
            </>
          )}
          {view === "notes" && (
            <>
              <div className="eyebrow">Notes · Product launch</div>
              <h4>Launch plan, v3</h4>
              <div className="app-line" style={{ width: "92%" }} />
              <div className="app-line" style={{ width: "78%" }} />
              <div className="app-line" style={{ width: "86%" }} />
              <Tasks title="Linked tasks" />
            </>
          )}
          {view === "todo" && (
            <>
              <div className="eyebrow">To-do</div>
              <h4>Plan next to the work</h4>
              <Tasks title="This week" />
            </>
          )}
          {view === "email" && (
            <div className="app-mail">
              <div className="app-mlist">
                {MAILS.map((m, k) => (
                  <button
                    key={m.s}
                    className={mail === k ? "on" : ""}
                    onClick={() => setMail(k)}
                  >
                    <b>{m.f}</b>
                    <span>{m.s}</span>
                    <small>{m.a}</small>
                  </button>
                ))}
              </div>
              <div className="app-mview">
                <div className="eyebrow">{MAILS[mail].a} · full thread</div>
                <h4 style={{ fontSize: 24 }}>{MAILS[mail].s}</h4>
                <p className="app-p">{MAILS[mail].p}</p>
                <div className="app-chips">
                  <span>
                    <FA icon={faReply} /> Reply
                  </span>
                  <span>Reply all</span>
                  <span>
                    <FA icon={faPaperclip} /> 1 file
                  </span>
                </div>
              </div>
            </div>
          )}
          {view === "calendar" && (
            <>
              <div className="eyebrow">Calendar · Work + Personal</div>
              <div className="app-week">
                {[
                  ["Mon", "Planning", "green"],
                  ["Tue", "1:1 Sam", "amber"],
                  ["Wed", "Gym", "violet"],
                  ["Thu", "Launch", "green"],
                  ["Fri", "Lunch", "clay"],
                ].map(([d, e, c]) => (
                  <div key={d}>
                    <small>{d}</small>
                    <span
                      style={{
                        background: `var(--${c}-bg)`,
                        color: `var(--${c}-fg)`,
                      }}
                    >
                      {e}
                    </span>
                  </div>
                ))}
              </div>
              <div className="app-line" style={{ width: "80%" }} />
            </>
          )}
          {view === "meetings" && (
            <>
              <div className="eyebrow">
                <FA icon={faCircleDot} style={{ color: "#c0493a" }} /> Recording
                · Launch review
              </div>
              <h4>Capture, transcribe, follow through</h4>
              <div className="app-wave" aria-hidden>
                {Array.from({ length: 28 }).map((_, k) => (
                  <i key={k} style={{ animationDelay: `${k * 60}ms` }} />
                ))}
              </div>
              <p className="app-p">
                <b>Maya:</b> Let’s lock pricing by Thursday.
              </p>
              <div className="app-chips">
                <span>Action: update pricing page</span>
                <span>Action: send recap</span>
              </div>
            </>
          )}
          {view === "automations" && (
            <>
              <div className="eyebrow">Automations</div>
              {rules.map((r, k) => (
                <div className="app-rule" key={r.t}>
                  <FA icon={faBolt} />
                  <div>
                    <b>{r.t}</b>
                    <small>{r.s}</small>
                  </div>
                  <button
                    role="switch"
                    aria-checked={r.on}
                    aria-label={r.t}
                    className="app-sw"
                    onClick={() =>
                      setRules((a) =>
                        a.map((x, n) => (n === k ? { ...x, on: !x.on } : x)),
                      )
                    }
                  >
                    <i />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        <aside className="app-rail">
          <div className="eyebrow app-sec" style={{ marginTop: 0 }}>
            Today
          </div>
          {TODAY.map((e) => (
            <div
              className="app-ev"
              key={e.t}
              style={{
                background: `var(--${e.c}-bg)`,
                color: `var(--${e.c}-fg)`,
              }}
            >
              {e.t}
              <small>{e.s}</small>
            </div>
          ))}
          <div className="eyebrow app-sec">Inbox</div>
          <div
            className="app-ev"
            style={{ background: "var(--surface-sunken)" }}
          >
            Re: Q3 roadmap<small>Gmail · full thread</small>
          </div>
        </aside>
      </div>
    </div>
  );
}
