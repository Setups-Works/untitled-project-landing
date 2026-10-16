"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faCalendarDays,
  faCheck,
  faComments,
  faHouse,
  faListCheck,
  faMagnifyingGlass,
  faMessage,
  faPenToSquare,
  faPlus,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { BrandMark } from "./BrandMark";

/**
 * A miniature of the real signed-in dashboard for the landing hero: the same top bar (logo, glass section switcher with its sliding
 * lens, search, avatar) and the same cards, built from the app's own classes (`ap-card`, `ap-task`, `ap-greet`…) so it looks like
 * the product because it is styled by the same CSS. The data is sample data. The tabs switch between six views; it plays through
 * them on its own until you touch it.
 */

const TABS = [
  { id: "home", t: "Home", icon: faHouse },
  { id: "calendar", t: "Calendar", icon: faCalendarDays },
  { id: "journal", t: "Journal", icon: faBookOpen },
  { id: "chat", t: "Chat", icon: faComments },
  { id: "notes", t: "Notes", icon: faPenToSquare },
  { id: "todo", t: "To-do", icon: faListCheck },
] as const;
type Id = (typeof TABS)[number]["id"];

const TOUR: Id[] = ["home", "todo", "journal", "chat", "calendar", "notes"];
const SPRING = "ease-[cubic-bezier(0.34,1.45,0.5,1)]";

type Task = { t: string; d: boolean; when?: string };

function Row({ task, mode, onToggle }: { task: Task; mode: "overdue" | "today" | "upcoming"; onToggle: () => void }) {
  return (
    <li className="ap-task" data-done={task.d} data-mode={mode}>
      <button
        type="button"
        className="ap-check"
        role="checkbox"
        aria-checked={task.d}
        aria-label={`Mark “${task.t}” ${task.d ? "not done" : "done"}`}
        onClick={onToggle}
      >
        {task.d && <FA icon={faCheck} />}
      </button>
      <span className="ap-task-t">{task.t}</span>
      {task.when && <small className="ap-task-d">{task.when}</small>}
    </li>
  );
}

function TopBar({ view, onGo }: { view: Id; onGo: (id: Id) => void }) {
  const nav = useRef<HTMLElement>(null);
  const lens = useRef<HTMLSpanElement>(null);
  // The glass lens slides under whichever tab is active, like the one in the real app.
  useLayoutEffect(() => {
    const place = () => {
      const el = nav.current?.querySelector<HTMLElement>("[aria-current=page]");
      const l = lens.current;
      if (!el || !l) return;
      l.style.width = `${el.offsetWidth}px`;
      l.style.height = `${el.offsetHeight}px`;
      l.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`;
      l.style.opacity = "1";
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [view]);

  return (
    <div className="relative flex items-center justify-center px-3 py-3 sm:px-5">
      <span className="absolute left-4 hidden items-center gap-2 font-serif text-[20px] tracking-[-0.02em] xl:flex">
        <BrandMark size={26} />
        untitled project
      </span>
      <div className="flex items-center gap-2">
        <nav
          ref={nav}
          aria-label="App preview"
          className="relative flex gap-1 rounded-pill bg-white/60 p-[5px] shadow-glass backdrop-blur-xl backdrop-saturate-150"
        >
          <span
            ref={lens}
            aria-hidden
            className={`pointer-events-none absolute top-0 left-0 rounded-pill bg-linear-to-b from-white/95 via-white/70 to-white/50 opacity-0 shadow-jelly transition-[transform,width] duration-500 ${SPRING} motion-reduce:transition-none`}
          />
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={view === t.id ? "page" : undefined}
              onClick={() => onGo(t.id)}
              className="relative z-10 inline-flex h-[38px] items-center gap-2 rounded-pill px-3 text-[14px] text-fg-muted transition-colors hover:text-fg aria-[current=page]:font-semibold aria-[current=page]:text-fg md:px-4"
            >
              <FA icon={t.icon} />
              <span className="max-md:hidden">{t.t}</span>
            </button>
          ))}
        </nav>
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-full bg-white/60 text-[15px] text-fg-muted shadow-glass backdrop-blur-xl max-sm:hidden"
        >
          <FA icon={faMagnifyingGlass} />
        </span>
      </div>
      <span aria-hidden className="ap-avatar absolute right-4 grid place-items-center max-sm:hidden">
        A
      </span>
    </div>
  );
}

function Home({
  overdue,
  today,
  upcoming,
  toggle,
}: {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
  toggle: (g: "o" | "t" | "u", i: number) => void;
}) {
  const done = today.filter((t) => t.d).length;
  const pct = Math.round((done / today.length) * 100);
  return (
    <div className="ap-home">
      <div className="ap-greet">
        <h1 className="h2">
          Good morning, <span className="quiet">Ada</span> <em className="ap-plan">free</em>
        </h1>
        <small className="meta">Monday, 12 October</small>
      </div>
      <div className="ap-quick">
        {[
          [faListCheck, "Plan my day"],
          [faBookOpen, "Write today’s journal"],
          [faPenToSquare, "Capture a note"],
          [faComments, "Start a chat"],
        ].map(([icon, t]) => (
          <Link key={t as string} href="/signup" tabIndex={-1}>
            <FA icon={icon as typeof faHouse} /> {t as string}
          </Link>
        ))}
      </div>
      <div className="ap-grid">
        <div className="ap-col">
          <section aria-label="Today’s progress">
            <div className="ap-prog">
              <span>
                {done} of {today.length} tasks done today
              </span>
              <b>{pct}%</b>
            </div>
            <div className="ap-bar-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
              <i style={{ width: `${pct}%`, transition: "width .5s" }} />
            </div>
            <div className="ap-add">
              <FA icon={faPlus} />
              <span>Add a task for today…</span>
            </div>
          </section>
          <section className="ap-card at-amber">
            <div className="ap-card-h">
              <span>Focus</span>
              <small>
                {overdue.length} overdue · {today.filter((t) => !t.d).length} today
              </small>
            </div>
            <div className="ap-sec" data-k="overdue">
              Overdue
            </div>
            <ul>
              {overdue.map((t, i) => (
                <Row key={t.t} task={t} mode="overdue" onToggle={() => toggle("o", i)} />
              ))}
            </ul>
            <div className="ap-sec">Today</div>
            <ul>
              {today.map((t, i) => (
                <Row key={t.t} task={t} mode="today" onToggle={() => toggle("t", i)} />
              ))}
            </ul>
          </section>
          <div className="ap-two">
            <JournalCard />
            <ChatsCard />
          </div>
        </div>
        <div className="ap-col">
          <section className="ap-card at-mint">
            <div className="ap-card-h">
              <span>Upcoming</span>
            </div>
            <ul>
              {upcoming.map((t, i) => (
                <Row key={t.t} task={t} mode="upcoming" onToggle={() => toggle("u", i)} />
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function JournalCard() {
  return (
    <section className="ap-card at-violet">
      <div className="ap-card-h">
        <span>Today’s journal</span>
        <small>2 entries</small>
      </div>
      <ul className="ap-jlist">
        <li>
          <time>7:42 am</time>
          <span>Shipped the first draft of the launch plan.</span>
        </li>
        <li>
          <time>6:15 pm</time>
          <span>Stand-up went long, but the pricing discussion unblocked everyone.</span>
        </li>
      </ul>
      <span className="ap-foot">Open journal →</span>
    </section>
  );
}

function ChatsCard() {
  return (
    <section className="ap-card at-blue">
      <div className="ap-card-h">
        <span>
          <FA icon={faMessage} /> Recent chats
        </span>
      </div>
      <ul className="ap-chats">
        {[
          ["Launch notes", "2h ago"],
          ["Pricing page copy", "yesterday"],
          ["Weekly recap", "3d ago"],
        ].map(([t, a]) => (
          <li key={t}>
            <a>
              <span>{t}</span>
              <small>{a}</small>
            </a>
          </li>
        ))}
      </ul>
      <span className="ap-foot">+ New chat</span>
    </section>
  );
}

function TodoView({ today, toggle }: { today: Task[]; toggle: (g: "o" | "t" | "u", i: number) => void }) {
  return (
    <div className="ap-home">
      <div className="ap-greet">
        <h1 className="h2">Today</h1>
        <small className="meta">{today.filter((t) => !t.d).length} tasks</small>
      </div>
      <section className="ap-card at-violet">
        <div className="ap-card-h">
          <span>Plan next to the work</span>
          <small>List · Board · Calendar</small>
        </div>
        <ul>
          {today.map((t, i) => (
            <Row key={t.t} task={t} mode="today" onToggle={() => toggle("t", i)} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function JournalView() {
  return (
    <div className="ap-home">
      <div className="ap-greet">
        <h1 className="h2">
          Your <span className="quiet">journal</span>
        </h1>
        <small className="meta">Friday, 2 October</small>
      </div>
      <div className="ap-two">
        <JournalCard />
        <section className="ap-card at-sand">
          <div className="ap-card-h">
            <span>Earlier</span>
          </div>
          <ul className="ap-jlist">
            {[
              ["Thu", "Quiet day. Wrote most of the pricing page copy."],
              ["Wed", "Dentist at 4:30, then a long walk."],
              ["Tue", "Planning went well. Everyone left with an owner."],
            ].map(([d, b]) => (
              <li key={d}>
                <time>{d}</time>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function ChatView() {
  return (
    <div className="ap-home">
      <div className="ap-greet">
        <h1 className="h2">
          Launch <span className="quiet">notes</span>
        </h1>
        <small className="meta">Chat with AI</small>
      </div>
      <section className="ap-card at-mint">
        <div className="flex flex-col gap-3 p-5">
          <div className="ml-auto max-w-[75%] rounded-r3 rounded-br-r1 bg-fg px-4 py-2.5 text-[14px] text-on-dark">
            Turn that into a task for Friday.
          </div>
          <div className="max-w-[85%] rounded-r3 rounded-bl-r1 bg-white/85 px-4 py-3 text-[14px] text-fg shadow-e1">
            <span className="mb-1.5 flex items-center gap-1.5 text-[12px] text-green-fg">
              <FA icon={faWandMagicSparkles} /> Draft task
            </span>
            Send the recap to the team
            <span className="mt-2.5 flex gap-2">
              <span className="rounded-pill bg-surface-sunken px-3.5 py-1.5 text-[12.5px] text-fg-muted">Not now</span>
              <span className="rounded-pill bg-fg px-3.5 py-1.5 text-[12.5px] text-on-dark">Confirm and save</span>
            </span>
          </div>
          <p className="text-center text-[12px] text-fg-faint">Nothing is saved until you confirm.</p>
        </div>
      </section>
    </div>
  );
}

function CalendarView() {
  const week: [string, string, string][] = [
    ["Mon", "Planning", "at-green"],
    ["Tue", "1:1 with Sam", "at-blue"],
    ["Wed", "Gym", "at-violet"],
    ["Thu", "Launch review", "at-amber"],
    ["Fri", "Team lunch", "at-clay"],
  ];
  return (
    <div className="ap-home">
      <div className="ap-greet">
        <h1 className="h2">
          This <span className="quiet">week</span>
        </h1>
        <small className="meta">Month · Week · Day · Agenda</small>
      </div>
      <section className="ap-card at-green">
        <ul>
          {week.map(([d, e, c]) => (
            <li key={d} className="ap-task">
              <small className="w-9 text-[12.5px] text-fg-subtle">{d}</small>
              <span className={`${c} tint flex-1 rounded-[7px] px-3 py-1 text-[13.5px]`}>{e}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function NotesView() {
  const notes: [string, string, string][] = [
    ["Launch plan, v3", "Owners, dates and the pricing decision.", "at-blue"],
    ["Ideas", "Weekly recap digest. A calmer inbox.", "at-violet"],
    ["Pricing", "Compare Workspace and Pro limits.", "at-amber"],
  ];
  return (
    <div className="ap-home">
      <div className="ap-greet">
        <h1 className="h2">
          Your <span className="quiet">notes</span>
        </h1>
        <small className="meta">3 notes</small>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {notes.map(([t, d, c]) => (
          <section key={t} className={`ap-card ${c}`}>
            <div className="ap-card-h">
              <span>{t}</span>
            </div>
            <p className="ap-none">{d}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function HeroApp() {
  const [view, setView] = useState<Id>("home");
  const [auto, setAuto] = useState(true);
  const [overdue, setOverdue] = useState<Task[]>([{ t: "Send invoice to Dev", d: false, when: "2d ago" }]);
  const [today, setToday] = useState<Task[]>([
    { t: "Draft announcement", d: true },
    { t: "Review pricing page with team", d: false },
    { t: "Send recap to #launch on Slack", d: false },
  ]);
  const [upcoming, setUpcoming] = useState<Task[]>([
    { t: "Book the venue", d: false, when: "Tomorrow" },
    { t: "Pricing sign-off", d: false, when: "Wed, 14 Oct" },
    { t: "Quarterly review", d: false, when: "Fri, 16 Oct" },
  ]);

  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setView((v) => TOUR[(TOUR.indexOf(v) + 1) % TOUR.length]), 5200);
    return () => clearInterval(t);
  }, [auto]);

  const toggle = (g: "o" | "t" | "u", i: number) => {
    const flip = (list: Task[]) => list.map((x, k) => (k === i ? { ...x, d: !x.d } : x));
    if (g === "o") setOverdue(flip);
    else if (g === "t") setToday(flip);
    else setUpcoming(flip);
  };

  return (
    <div className="relative bg-page text-fg" onPointerDown={() => setAuto(false)}>
      <TopBar
        view={view}
        onGo={(id) => {
          setView(id);
          setAuto(false);
        }}
      />
      <div className="relative h-[clamp(430px,46vw,580px)] overflow-hidden px-4 pt-2 sm:px-6">
        <div key={view} className="animate-glass-fade motion-reduce:animate-none">
          {view === "home" && <Home overdue={overdue} today={today} upcoming={upcoming} toggle={toggle} />}
          {view === "todo" && <TodoView today={today} toggle={toggle} />}
          {view === "journal" && <JournalView />}
          {view === "chat" && <ChatView />}
          {view === "calendar" && <CalendarView />}
          {view === "notes" && <NotesView />}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-page to-transparent" />
      </div>
    </div>
  );
}
