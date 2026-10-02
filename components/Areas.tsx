"use client";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faBookOpen,
  faPenToSquare,
  faListCheck,
  faTableColumns,
  faEnvelope,
  faCalendarDays,
  faMicrophone,
  faDiagramProject,
  faWandMagicSparkles,
  faPlus,
  faXmark,
  faCheck,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const AREAS = [
  {
    icon: faHouse,
    t: "Home",
    d: "Your main workspace.",
    tone: "sand",
    long: "Home is where you start. It’s the main workspace that brings your notes, tasks, journal, email, calendar, meetings and automations together in one place.",
    pts: [
      "The primary entry point to your workspace",
      "Notes, to-do, journal, email, calendar and meetings side by side",
      "External integrations provide connected context",
    ],
    href: "#",
  },
  {
    icon: faBookOpen,
    t: "Journal",
    d: "A private record of your days.",
    tone: "violet",
    long: "A private place to write down your days and come back to them later — kept close to the work.",
    pts: [
      "A record of your days",
      "Private by design",
      "Connected to your notes",
      "Context from your calendar",
      "AI only if you want it",
    ],
    href: "#journal",
  },
  {
    icon: faPenToSquare,
    t: "Notes",
    d: "A proper place to think, write and organize.",
    tone: "blue",
    long: "Write. Organize. Connect. Come back to it later. Use AI when it helps — ignore it when it doesn’t.",
    pts: [
      "Rich notes",
      "Tables with formulas and linked columns",
      "Backlinks + Atlas",
      "Version history",
      "Web clipper",
      "Import + export",
    ],
    href: "#notes",
  },
  {
    icon: faListCheck,
    t: "To-do",
    d: "Plan next to the work.",
    tone: "amber",
    long: "Keep your tasks next to the notes, journal entries and meetings they come from, so planning never lives in a separate app.",
    pts: [
      "To-do lists and planning",
      "Task context alongside your work",
      "Turn reflections and meeting follow-ups into tasks",
    ],
    href: "#",
  },
  {
    icon: faTableColumns,
    t: "Overview",
    d: "The whole workspace at a glance.",
    tone: "mint",
    long: "A high-level view of everything in your workspace, so you can see what’s going on without opening every area.",
    pts: [
      "The whole workspace at a glance",
      "Pulls context from your connected services",
    ],
    href: "#",
  },
  {
    icon: faEnvelope,
    t: "Email",
    d: "Gmail and Outlook in the workspace.",
    tone: "green",
    long: "Connect Gmail or Outlook and bring the conversations that matter into the workspace.",
    pts: [
      "Read complete threads",
      "Compose, reply and reply all",
      "Forward and work with attachments",
      "Keep the full context together",
      "Up to 5 email accounts with Pro",
    ],
    href: "#email",
  },
  {
    icon: faCalendarDays,
    t: "Calendar",
    d: "One view of your time.",
    tone: "gold",
    long: "Connect your calendar and keep meetings, plans, reminders and the context around them together.",
    pts: [
      "Sync events",
      "Unified schedule view",
      "Work and personal in one place",
      "Up to 5 calendars with Pro",
    ],
    href: "#calendar",
  },
  {
    icon: faMicrophone,
    t: "Meetings",
    d: "Capture, transcribe, follow through.",
    tone: "clay",
    long: "Capture what was said, get it transcribed, and follow through on what comes out of it.",
    pts: [
      "Capture and transcribe meetings",
      "Follow-through after the call",
      "Works with Google Meet, Microsoft Teams and Zoom",
    ],
    href: "#integrations",
  },
  {
    icon: faDiagramProject,
    t: "Automations",
    d: "Workflows that run themselves.",
    tone: "blue",
    long: "Automated workflows and actions that connect your workspace and the tools you already use.",
    pts: [
      "Rules, triggers and actions",
      "Scheduled workflows",
      "Works across your connected integrations",
    ],
    href: "#",
  },
  {
    icon: faWandMagicSparkles,
    t: "Personality Insights",
    d: "A dedicated area for insights.",
    tone: "violet",
    long: "A dedicated insights area in your workspace navigation, built from what you do in the workspace.",
    pts: [
      "Its own place in the workspace",
      "Insights derived from your workspace",
    ],
    href: "#",
  },
];

export default function Areas() {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const step = () => {
    const el = ref.current;
    const c = el?.children[0] as HTMLElement | undefined;
    return c ? c.offsetWidth + 14 : 300;
  };
  const go = (dir: number) =>
    ref.current?.scrollBy({ left: dir * step(), behavior: "smooth" });
  const onScroll = () => {
    const el = ref.current;
    if (el) setI(Math.round(el.scrollLeft / step()));
  };

  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", k);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", k);
      opener.current?.focus();
    };
  }, [open]);

  const a = open === null ? null : AREAS[open];
  return (
    <div className="acar">
      <div
        className="acar-track"
        ref={ref}
        onScroll={onScroll}
        tabIndex={0}
        aria-label="Workspace areas"
      >
        {AREAS.map((x, n) => (
          <article className={`acard at-${x.tone}`} key={x.t}>
            <FA icon={x.icon} className="acard-bg" aria-hidden />
            <span className="acard-ico">
              <FA icon={x.icon} />
            </span>
            <div className="acard-body">
              <h3 className="acard-title">{x.t}</h3>
              <p className="acard-desc">{x.d}</p>
            </div>
            <button
              className="acard-plus"
              aria-label={`More about ${x.t}`}
              aria-haspopup="dialog"
              onClick={(e) => {
                opener.current = e.currentTarget;
                setOpen(n);
              }}
            >
              <FA icon={faPlus} />
            </button>
          </article>
        ))}
      </div>
      <div className="car-ctl">
        <div className="dots">
          {AREAS.map((x, n) => (
            <span key={x.t} data-on={n === i} />
          ))}
        </div>
        <div className="arrows">
          <button
            className="arrow"
            aria-label="Previous"
            onClick={() => go(-1)}
          >
            <FA icon={faChevronLeft} />
          </button>
          <button className="arrow" aria-label="Next" onClick={() => go(1)}>
            <FA icon={faChevronRight} />
          </button>
        </div>
      </div>

      {a && (
        <div className="modal" onClick={() => setOpen(null)}>
          <div
            className={`modal-card at-${a.tone}`}
            role="dialog"
            aria-modal="true"
            aria-label={a.t}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeBtn}
              className="modal-x"
              aria-label="Close"
              onClick={() => setOpen(null)}
            >
              <FA icon={faXmark} />
            </button>
            <span className="acard-ico">
              <FA icon={a.icon} />
            </span>
            <h3 className="modal-title">{a.t}</h3>
            <p className="modal-lead">{a.long}</p>
            <ul className="modal-pts">
              {a.pts.map((p) => (
                <li key={p}>
                  <FA icon={faCheck} />
                  {p}
                </li>
              ))}
            </ul>
            {a.href !== "#" && (
              <a
                className="btn btn-primary btn-sm"
                href={a.href}
                onClick={() => setOpen(null)}
              >
                See it in the page
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
