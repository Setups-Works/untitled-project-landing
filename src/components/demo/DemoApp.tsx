"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faHouse, faBookOpen, faPenToSquare, faListCheck, faEnvelope, faCalendarDays, faMicrophone, faDiagramProject, faMagnifyingGlass,
  faCheck, faPlus, faTrash, faStar, faBoxArchive, faReply, faWandMagicSparkles, faClockRotateLeft, faStop, faCircle, faBolt, faRotateRight,
  faXmark, faLink, faPlay, faShieldHalved, faBan, faKey, faPlug, faWallet,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  ACTIONS, DAYS, HOURS, MOODS, NOTE_BODY, STEPS, TODAY, TRANSCRIPT,
  seedEntries, seedEvents, seedMail, seedRules, seedTasks,
  type Entry, type Ev, type Mail, type Rule, type Task, type Version,
} from "./data";

type View = "home" | "journal" | "notes" | "todo" | "email" | "calendar" | "meetings" | "automations";
const NAV: { id: View; t: string; i: IconDefinition }[] = [
  { id: "home", t: "Home", i: faHouse },
  { id: "journal", t: "Journal", i: faBookOpen },
  { id: "notes", t: "Notes", i: faPenToSquare },
  { id: "todo", t: "To-do", i: faListCheck },
  { id: "email", t: "Email", i: faEnvelope },
  { id: "calendar", t: "Calendar", i: faCalendarDays },
  { id: "meetings", t: "Meetings", i: faMicrophone },
  { id: "automations", t: "Automations", i: faDiagramProject },
];
const PROVIDERS = [
  { id: "key", t: "Bring your own key", i: faKey },
  { id: "account", t: "Supported AI account", i: faPlug },
  { id: "payg", t: "Pay as you go", i: faWallet },
];
const hh = (h: number) => `${h > 12 ? h - 12 : h}${h >= 12 ? "pm" : "am"}`;
const stamp = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

type Hit = { type: string; title: string; sub: string; view: View };

export default function DemoApp() {
  const [view, setView] = useState<View>("home");
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [mail, setMail] = useState<Mail[]>(seedMail);
  const [events, setEvents] = useState<Ev[]>(seedEvents);
  const [entries, setEntries] = useState<Entry[]>(seedEntries);
  const [rules, setRules] = useState<Rule[]>(seedRules);
  const [logs, setLogs] = useState<string[]>([]);
  const [body, setBody] = useState(NOTE_BODY);
  const [versions, setVersions] = useState<Version[]>([{ id: 0, at: "Yesterday", body: NOTE_BODY }]);
  const [ai, setAi] = useState(true);
  const [provider, setProvider] = useState("key");
  const [done, setDone] = useState<string[]>([]);
  const [palette, setPalette] = useState(false);
  const [toast, setToast] = useState("");
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const [ended, setEnded] = useState(false);

  const mark = useCallback((id: string) => setDone((d) => (d.includes(id) ? d : [...d, id])), []);
  const say = useCallback((m: string) => {
    setToast(m);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(""), 2400);
  }, []);
  const log = useCallback((m: string) => setLogs((l) => [`${stamp()} · ${m}`, ...l].slice(0, 6)), []);
  const addTask = useCallback((t: string, from?: string) => {
    const clean = t.trim();
    if (!clean) return;
    setTasks((a) => (a.some((x) => x.t === clean) ? a : [...a, { id: Date.now() + Math.random(), t: clean, done: false, from }]));
  }, []);

  /* ⌘K / Ctrl+K opens search */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  /* meeting timer + transcript */
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    const l = setInterval(() => setLines((a) => (a.length < TRANSCRIPT.length ? [...a, TRANSCRIPT[a.length]] : a)), 1700);
    return () => { clearInterval(t); clearInterval(l); };
  }, [recording]);

  const startMeeting = () => { setRecording(true); setEnded(false); setSecs(0); setLines([]); };
  const stopMeeting = () => {
    setRecording(false);
    setEnded(true);
    mark("meeting");
    const on = (id: string) => rules.find((r) => r.id === id)?.on;
    if (on("actions")) { ACTIONS.forEach((a) => addTask(a, "Meeting")); log("Added 2 action items to your to-do"); say("Automation added 2 tasks from the meeting"); }
    if (on("recap")) log("Posted the recap to #launch on Slack (simulated)");
  };

  const reset = () => {
    setTasks(seedTasks()); setMail(seedMail()); setEvents(seedEvents()); setEntries(seedEntries()); setRules(seedRules()); setLogs([]);
    setBody(NOTE_BODY); setVersions([{ id: 0, at: "Yesterday", body: NOTE_BODY }]); setAi(true); setDone([]); setRecording(false); setEnded(false); setLines([]); setView("home");
    say("Demo reset");
  };

  /* search index */
  const index = useMemo<Hit[]>(
    () => [
      ...tasks.map((t) => ({ type: "Task", title: t.t, sub: t.done ? "Done" : "Open", view: "todo" as View })),
      ...mail.filter((m) => !m.archived).map((m) => ({ type: "Email", title: m.subj, sub: `${m.from} · ${m.app}`, view: "email" as View })),
      ...events.map((e) => ({ type: "Event", title: e.t, sub: `${DAYS[e.day]} ${hh(e.hour)}`, view: "calendar" as View })),
      ...entries.map((e) => ({ type: "Journal", title: e.text.slice(0, 60), sub: e.when, view: "journal" as View })),
      { type: "Note", title: "Launch plan, v3", sub: "Notes", view: "notes" as View },
      { type: "Meeting", title: "Launch review — transcript", sub: "Meetings", view: "meetings" as View },
    ],
    [tasks, mail, events, entries],
  );

  const openTasks = tasks.filter((t) => !t.done).length;
  const unread = mail.filter((m) => m.unread && !m.archived).length;
  const todayEv = events.filter((e) => e.day === TODAY).sort((a, b) => a.hour - b.hour);

  return (
    <div className="da">
      <div className="da-bar">
        <span className="da-dots"><i /><i /><i /></span>
        <button className="da-search" onClick={() => setPalette(true)} aria-label="Search everything">
          <FA icon={faMagnifyingGlass} /> <span>Search everything</span> <kbd>⌘K</kbd>
        </button>
        <div className="da-ai">
          <button role="switch" aria-checked={ai} className="da-switch" onClick={() => { setAi(!ai); if (ai) { mark("ai"); say("AI is off — the workspace works the same"); } else say("AI is on"); }}>
            <FA icon={ai ? faWandMagicSparkles : faBan} /> AI {ai ? "on" : "off"}
            <i data-on={ai}><b /></i>
          </button>
          {ai && (
            <select aria-label="AI provider" value={provider} onChange={(e) => { setProvider(e.target.value); say("Provider changed — your content didn’t move"); }}>
              {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.t}</option>)}
            </select>
          )}
        </div>
        <button className="da-reset" onClick={reset} aria-label="Reset demo"><FA icon={faRotateRight} /></button>
      </div>

      <div className="da-body">
        <nav className="da-side" aria-label="Demo navigation">
          {NAV.map((n) => (
            <button key={n.id} className={view === n.id ? "on" : ""} aria-pressed={view === n.id} onClick={() => setView(n.id)}>
              <FA icon={n.i} /><span>{n.t}</span>
              {n.id === "email" && unread > 0 && <em>{unread}</em>}
              {n.id === "todo" && openTasks > 0 && <em>{openTasks}</em>}
            </button>
          ))}
          <div className="da-priv"><FA icon={faShieldHalved} /> Your workspace stays put, whichever AI you pick.</div>
        </nav>

        <div className="da-main" key={view}>
          {view === "home" && (
            <Home openTasks={openTasks} unread={unread} events={todayEv.length} go={setView} addTask={(t) => { addTask(t); mark("task"); say("Task added"); }} openSearch={() => setPalette(true)} startMeeting={() => { setView("meetings"); startMeeting(); }} ai={ai} />
          )}
          {view === "journal" && <Journal entries={entries} ai={ai} save={(mood, text) => { setEntries((e) => [{ id: Date.now(), when: "Today", mood, text }, ...e]); say("Entry saved"); }} />}
          {view === "notes" && (
            <Notes body={body} setBody={setBody} versions={versions} ai={ai} go={setView}
              save={() => { setVersions((v) => [{ id: Date.now(), at: stamp(), body }, ...v]); mark("note"); say("Version saved"); }}
              restore={(v) => { setBody(v.body); say("Version restored"); }} />
          )}
          {view === "todo" && (
            <Todo tasks={tasks}
              add={(t) => { addTask(t); mark("task"); }}
              toggle={(id) => { setTasks((a) => a.map((x) => (x.id === id ? { ...x, done: !x.done } : x))); mark("task"); }}
              remove={(id) => setTasks((a) => a.filter((x) => x.id !== id))} />
          )}
          {view === "email" && (
            <Inbox mail={mail} ai={ai}
              update={(id, p) => setMail((m) => m.map((x) => (x.id === id ? { ...x, ...p } : x)))}
              reply={(id, text) => { setMail((m) => m.map((x) => (x.id === id ? { ...x, msgs: [...x.msgs, { who: "You", text }] } : x))); mark("reply"); say("Reply sent"); }} />
          )}
          {view === "calendar" && (
            <Calendar events={events}
              add={(day, hour, t) => { setEvents((e) => [...e, { id: Date.now(), day, hour, t, tone: ["green", "amber", "violet", "clay"][Date.now() % 4] }]); mark("event"); say("Event added"); }}
              remove={(id) => setEvents((e) => e.filter((x) => x.id !== id))} />
          )}
          {view === "meetings" && (
            <Meetings recording={recording} secs={secs} lines={lines} ended={ended} ai={ai} start={startMeeting} stop={stopMeeting} tasks={tasks}
              addAction={(a) => { addTask(a, "Meeting"); mark("task"); say("Added to your to-do"); }} />
          )}
          {view === "automations" && (
            <Automations rules={rules} logs={logs}
              toggle={(id) => { setRules((r) => r.map((x) => (x.id === id ? { ...x, on: !x.on } : x))); mark("rule"); }}
              run={(r) => { log(`Ran “${r.t}”`); mark("rule"); say("Automation ran (simulated)"); }} />
          )}
        </div>

        <aside className="da-rail">
          <div className="eyebrow">Today · Wed</div>
          <div className="da-agenda">
            {todayEv.map((e) => <div key={e.id} className="da-ev" style={{ background: `var(--${e.tone}-bg)`, color: `var(--${e.tone}-fg)` }}>{e.t}<small>{hh(e.hour)}</small></div>)}
            {todayEv.length === 0 && <p className="meta">Nothing scheduled.</p>}
          </div>
          <div className="da-tour">
            <div className="da-tour-h"><div className="eyebrow">Guided tour</div><b>{done.length}/{STEPS.length}</b></div>
            <div className="da-prog"><i style={{ width: `${(done.length / STEPS.length) * 100}%` }} /></div>
            <ul>
              {STEPS.map((s) => (
                <li key={s.id}>
                  <button data-done={done.includes(s.id)} onClick={() => (s.id === "search" ? setPalette(true) : setView(s.view as View))}>
                    <span>{done.includes(s.id) && <FA icon={faCheck} />}</span>{s.t}
                  </button>
                </li>
              ))}
            </ul>
            {done.length === STEPS.length && <p className="da-win">You’ve seen it all. Ready for the real thing?</p>}
          </div>
        </aside>
      </div>

      {palette && (
        <Palette index={index} close={() => setPalette(false)} pick={(h) => { setView(h.view); setPalette(false); mark("search"); }} />
      )}
      {toast && <div className="da-toast" role="status"><FA icon={faCheck} /> {toast}</div>}
    </div>
  );
}

/* ---------- views ---------- */

function Home({ openTasks, unread, events, go, addTask, openSearch, startMeeting, ai }: {
  openTasks: number; unread: number; events: number; go: (v: View) => void; addTask: (t: string) => void; openSearch: () => void; startMeeting: () => void; ai: boolean;
}) {
  const [t, setT] = useState("");
  return (
    <>
      <div className="eyebrow">Home</div>
      <h4>Good morning</h4>
      <div className="da-stats">
        {([["events today", events, "calendar", "amber"], ["open tasks", openTasks, "todo", "violet"], ["unread threads", unread, "email", "green"]] as const).map(([l, n, v, c]) => (
          <button key={l} className={`at-${c}`} onClick={() => go(v)}><b>{n}</b><span>{l}</span></button>
        ))}
      </div>
      {ai && <div className="da-brief"><FA icon={faWandMagicSparkles} /><p>Daily Brief: the Launch review at 11:00 is the one that matters — pricing is still open, and Maya’s thread is waiting on you.</p></div>}
      {!ai && <div className="da-brief off"><FA icon={faBan} /><p>AI is off. Everything below still works — you just get the plain list instead of a summary.</p></div>}
      <form className="da-add" onSubmit={(e) => { e.preventDefault(); addTask(t); setT(""); }}>
        <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Quick add a task…" aria-label="Quick add a task" />
        <button className="btn btn-primary btn-sm" disabled={!t.trim()}><FA icon={faPlus} /> Add</button>
      </form>
      <div className="da-chips">
        <button onClick={openSearch}><FA icon={faMagnifyingGlass} /> Search</button>
        <button onClick={startMeeting}><FA icon={faMicrophone} /> Start a meeting</button>
        <button onClick={() => go("notes")}><FA icon={faPenToSquare} /> Open the launch plan</button>
      </div>
    </>
  );
}

function Journal({ entries, save, ai }: { entries: Entry[]; save: (mood: string, text: string) => void; ai: boolean }) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("Focused");
  const [prompt, setPrompt] = useState("");
  return (
    <>
      <div className="eyebrow">Journal · Today</div>
      <h4>How was today?</h4>
      <textarea className="da-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a few lines. It’s private." />
      <div className="da-chips">
        {MOODS.map((m) => <button key={m} data-on={m === mood} onClick={() => setMood(m)}>{m}</button>)}
      </div>
      <div className="da-row">
        <button className="btn btn-primary btn-sm" disabled={!text.trim()} onClick={() => { save(mood, text.trim()); setText(""); setPrompt(""); }}>Save entry</button>
        <button className="btn btn-secondary btn-sm" disabled={!ai} title={ai ? "" : "AI is off"} onClick={() => setPrompt("What’s one thing from today you’d want to remember in a month?")}>
          <FA icon={faWandMagicSparkles} /> Reflect
        </button>
      </div>
      {prompt && <p className="da-ai-note"><FA icon={faWandMagicSparkles} /> {prompt}</p>}
      <div className="da-list">
        {entries.map((e) => <div key={e.id} className="da-entry"><small>{e.when} · {e.mood}</small><p>{e.text}</p></div>)}
      </div>
    </>
  );
}

function Notes({ body, setBody, versions, save, restore, ai, go }: {
  body: string; setBody: (s: string) => void; versions: Version[]; save: () => void; restore: (v: Version) => void; ai: boolean; go: (v: View) => void;
}) {
  const [hist, setHist] = useState(false);
  const [sum, setSum] = useState("");
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const links = Array.from(new Set([...body.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1])));
  const to = (n: string): View => (/roadmap/i.test(n) ? "email" : /review|meeting/i.test(n) ? "calendar" : "notes");
  return (
    <>
      <div className="eyebrow">Notes · Product launch</div>
      <h4>Launch plan, v3</h4>
      <textarea className="da-text note" rows={9} value={body} onChange={(e) => setBody(e.target.value)} aria-label="Note body" />
      <div className="da-row between">
        <span className="meta">{words} words · type [[Name]] to link</span>
        <div className="da-row">
          <button className="btn btn-secondary btn-sm" onClick={() => setHist(!hist)}><FA icon={faClockRotateLeft} /> History ({versions.length})</button>
          <button className="btn btn-secondary btn-sm" disabled={!ai} title={ai ? "" : "AI is off"} onClick={() => setSum(body.split(/\n+/).filter(Boolean).slice(0, 2).join(" "))}><FA icon={faWandMagicSparkles} /> Summarize</button>
          <button className="btn btn-primary btn-sm" onClick={save}>Save version</button>
        </div>
      </div>
      {sum && <p className="da-ai-note"><FA icon={faWandMagicSparkles} /> {sum}</p>}
      {links.length > 0 && <div className="da-chips">{links.map((l) => <button key={l} onClick={() => go(to(l))}><FA icon={faLink} /> {l}</button>)}</div>}
      {hist && (
        <div className="da-list">
          {versions.map((v) => (
            <div key={v.id} className="da-entry"><small>{v.at}</small><p>{v.body.slice(0, 90)}…</p><button onClick={() => restore(v)}>Restore</button></div>
          ))}
        </div>
      )}
    </>
  );
}

function Todo({ tasks, add, toggle, remove }: { tasks: Task[]; add: (t: string) => void; toggle: (id: number) => void; remove: (id: number) => void }) {
  const [t, setT] = useState("");
  const [f, setF] = useState<"All" | "Open" | "Done">("All");
  const shown = tasks.filter((x) => (f === "All" ? true : f === "Open" ? !x.done : x.done));
  const pct = tasks.length ? Math.round((tasks.filter((x) => x.done).length / tasks.length) * 100) : 0;
  return (
    <>
      <div className="eyebrow">To-do</div>
      <div className="da-head">
        <h4>Plan next to the work</h4>
        <div className="da-ring" style={{ ["--p" as string]: pct }}><b>{pct}%</b></div>
      </div>
      <form className="da-add" onSubmit={(e) => { e.preventDefault(); add(t); setT(""); }}>
        <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Add a task and press Enter" aria-label="New task" />
        <button className="btn btn-primary btn-sm" disabled={!t.trim()}><FA icon={faPlus} /> Add</button>
      </form>
      <div className="da-chips">{(["All", "Open", "Done"] as const).map((x) => <button key={x} data-on={f === x} onClick={() => setF(x)}>{x}</button>)}</div>
      <div className="da-list">
        {shown.map((x) => (
          <div key={x.id} className={`da-task${x.done ? " done" : ""}`}>
            <button className="da-check" aria-pressed={x.done} aria-label={`Toggle ${x.t}`} onClick={() => toggle(x.id)}>{x.done && <FA icon={faCheck} />}</button>
            <span>{x.t}</span>
            {x.from && <small className="da-tag">from {x.from}</small>}
            <button className="icon-btn" aria-label={`Delete ${x.t}`} onClick={() => remove(x.id)}><FA icon={faTrash} /></button>
          </div>
        ))}
        {shown.length === 0 && <p className="meta" style={{ padding: 14 }}>Nothing here.</p>}
      </div>
    </>
  );
}

function Inbox({ mail, update, reply, ai }: { mail: Mail[]; update: (id: number, p: Partial<Mail>) => void; reply: (id: number, t: string) => void; ai: boolean }) {
  const list = mail.filter((m) => !m.archived);
  const [sel, setSel] = useState<number | null>(list[0]?.id ?? null);
  const [text, setText] = useState("");
  const cur = list.find((m) => m.id === sel) ?? list[0];
  return (
    <div className="da-mail">
      <div className="da-mlist">
        {list.map((m) => (
          <button key={m.id} className={cur?.id === m.id ? "on" : ""} onClick={() => { setSel(m.id); update(m.id, { unread: false }); }}>
            {m.unread && <i className="da-unread" />}
            <b>{m.from}</b><span>{m.subj}</span><small>{m.app}{m.starred ? " · ★" : ""}</small>
          </button>
        ))}
        {list.length === 0 && <p className="meta">Inbox zero. 🎉</p>}
      </div>
      {cur ? (
        <div className="da-mview">
          <div className="da-row between">
            <h4 style={{ fontSize: 22, margin: 0 }}>{cur.subj}</h4>
            <div className="da-row">
              <button className="icon-btn" aria-label="Star" onClick={() => update(cur.id, { starred: !cur.starred })} style={cur.starred ? { color: "var(--amber-fg)" } : undefined}><FA icon={faStar} /></button>
              <button className="icon-btn" aria-label="Archive" onClick={() => update(cur.id, { archived: true })}><FA icon={faBoxArchive} /></button>
            </div>
          </div>
          <div className="da-thread">
            {cur.msgs.map((m, n) => <div key={n} className={m.who === "You" ? "me" : ""}><small>{m.who}</small><p>{m.text}</p></div>)}
          </div>
          <textarea className="da-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Reply to ${cur.from}…`} aria-label="Reply" />
          <div className="da-row">
            <button className="btn btn-primary btn-sm" disabled={!text.trim()} onClick={() => { reply(cur.id, text.trim()); setText(""); }}><FA icon={faReply} /> Send reply</button>
            <button className="btn btn-secondary btn-sm" disabled={!ai} title={ai ? "" : "AI is off"} onClick={() => setText(`Thanks ${cur.from} — confirmed. I’ll follow up by end of day.`)}><FA icon={faWandMagicSparkles} /> Draft with AI</button>
          </div>
        </div>
      ) : <div className="da-mview"><p className="meta">Select a message.</p></div>}
    </div>
  );
}

function Calendar({ events, add, remove }: { events: Ev[]; add: (d: number, h: number, t: string) => void; remove: (id: number) => void }) {
  const [slot, setSlot] = useState<[number, number] | null>(null);
  const [t, setT] = useState("");
  return (
    <>
      <div className="eyebrow">Calendar · Work + Personal</div>
      <h4>This week</h4>
      <p className="meta" style={{ marginBottom: 10 }}>Click any empty slot to add an event.</p>
      <div className="da-cal" role="grid">
        <div />
        {DAYS.map((d, i) => <b key={d} className={i === TODAY ? "today" : ""}>{d}</b>)}
        {HOURS.map((h) => (
          <div key={h} className="da-row-cal" style={{ display: "contents" }}>
            <small>{hh(h)}</small>
            {DAYS.map((_, d) => {
              const ev = events.find((e) => e.day === d && e.hour === h);
              return (
                <div key={d} className="cell">
                  {ev ? (
                    <span className="da-evb" style={{ background: `var(--${ev.tone}-bg)`, color: `var(--${ev.tone}-fg)` }}>
                      {ev.t}<button aria-label={`Remove ${ev.t}`} onClick={() => remove(ev.id)}><FA icon={faXmark} /></button>
                    </span>
                  ) : (
                    <button className="slot" aria-label={`Add event ${DAYS[d]} ${hh(h)}`} onClick={() => { setSlot([d, h]); setT(""); }}><FA icon={faPlus} /></button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {slot && (
        <form className="da-add pop" onSubmit={(e) => { e.preventDefault(); if (t.trim()) { add(slot[0], slot[1], t.trim()); setSlot(null); } }}>
          <input autoFocus value={t} onChange={(e) => setT(e.target.value)} placeholder={`New event · ${DAYS[slot[0]]} ${hh(slot[1])}`} aria-label="Event title" />
          <button className="btn btn-primary btn-sm" disabled={!t.trim()}>Add</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSlot(null)}>Cancel</button>
        </form>
      )}
    </>
  );
}

function Meetings({ recording, secs, lines, ended, ai, start, stop, tasks, addAction }: {
  recording: boolean; secs: number; lines: string[]; ended: boolean; ai: boolean; start: () => void; stop: () => void; tasks: Task[]; addAction: (a: string) => void;
}) {
  const mm = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <>
      <div className="eyebrow">{recording && <FA icon={faCircle} style={{ color: "#c0493a", fontSize: 8 }} />} Meetings · Launch review</div>
      <h4>Capture, transcribe, follow through</h4>
      <div className="da-rec">
        {recording ? (
          <button className="btn btn-primary btn-sm" onClick={stop}><FA icon={faStop} /> Stop · {mm}</button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={start}><FA icon={faPlay} /> {ended ? "Record again" : "Start recording"}</button>
        )}
        <div className="da-wave" data-on={recording} aria-hidden>{Array.from({ length: 36 }).map((_, i) => <i key={i} style={{ animationDelay: `${i * 55}ms` }} />)}</div>
      </div>
      <div className="da-list">
        {lines.map((l, i) => <div key={i} className="da-line">{l}</div>)}
        {!recording && lines.length === 0 && <p className="meta" style={{ padding: 14 }}>Press record to see a live transcript appear.</p>}
      </div>
      {ended && (
        <div className="da-after">
          {ai ? <p className="da-ai-note"><FA icon={faWandMagicSparkles} /> Summary: pricing will be locked by Thursday; Priya signs off the copy; a recap goes out today.</p>
              : <p className="da-ai-note off"><FA icon={faBan} /> AI is off — you get the transcript and your own notes.</p>}
          <div className="eyebrow" style={{ margin: "14px 0 8px" }}>Action items</div>
          {ACTIONS.map((a) => {
            const added = tasks.some((t) => t.t === a);
            return <div key={a} className="da-task"><span>{a}</span><button className="btn btn-secondary btn-sm" disabled={added} onClick={() => addAction(a)}>{added ? <><FA icon={faCheck} /> Added</> : "Add to to-do"}</button></div>;
          })}
        </div>
      )}
    </>
  );
}

function Automations({ rules, logs, toggle, run }: { rules: Rule[]; logs: string[]; toggle: (id: string) => void; run: (r: Rule) => void }) {
  return (
    <>
      <div className="eyebrow">Automations</div>
      <h4>Workflows that run themselves</h4>
      <div className="da-list">
        {rules.map((r) => (
          <div key={r.id} className="da-rule">
            <FA icon={faBolt} />
            <div><b>{r.t}</b><small>{r.s}</small></div>
            <button className="btn btn-secondary btn-sm" disabled={!r.on} onClick={() => run(r)}>Run now</button>
            <button role="switch" aria-checked={r.on} aria-label={r.t} className="app-sw" onClick={() => toggle(r.id)}><i /></button>
          </div>
        ))}
      </div>
      <div className="eyebrow" style={{ margin: "16px 0 8px" }}>Activity</div>
      <div className="da-list">
        {logs.map((l, i) => <div key={i} className="da-line">{l}</div>)}
        {logs.length === 0 && <p className="meta" style={{ padding: 14 }}>Run a rule, or record a meeting, to see activity here.</p>}
      </div>
    </>
  );
}

/* ---------- command palette ---------- */

function Palette({ index, close, pick }: { index: Hit[]; close: () => void; pick: (h: Hit) => void }) {
  const [q, setQ] = useState("");
  const [n, setN] = useState(0);
  const res = useMemo(() => index.filter((h) => !q || (h.title + " " + h.sub + " " + h.type).toLowerCase().includes(q.toLowerCase())).slice(0, 8), [index, q]);
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") { e.preventDefault(); setN((x) => Math.min(res.length - 1, x + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setN((x) => Math.max(0, x - 1)); }
    else if (e.key === "Enter" && res[n]) pick(res[n]);
  };
  return (
    <div className="da-pal" onClick={close}>
      <div className="da-pal-box" role="dialog" aria-label="Search" onClick={(e) => e.stopPropagation()} onKeyDown={key}>
        <div className="da-pal-in"><FA icon={faMagnifyingGlass} /><input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setN(0); }} placeholder="Search tasks, mail, events, notes…" aria-label="Search" /><kbd>esc</kbd></div>
        <ul>
          {res.map((h, i) => (
            <li key={h.type + h.title}><button data-on={i === n} onMouseEnter={() => setN(i)} onClick={() => pick(h)}><em>{h.type}</em><b>{h.title}</b><small>{h.sub}</small></button></li>
          ))}
          {res.length === 0 && <li className="none">No results for “{q}”.</li>}
        </ul>
      </div>
    </div>
  );
}
