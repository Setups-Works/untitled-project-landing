"use client";
import { useRef, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck, faMagnifyingGlass, faMicrophone, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { showNow, useMotion } from "../motion";

/**
 * The live miniatures inside the capability bento. Each one plays a short, looping scene with GSAP (or reacts to a click), so a tile
 * shows what the feature feels like. In reduced-motion mode they sit still in a representative state. Sample content only.
 */

const bar = "h-2 rounded-full bg-(--abf)/15";

/** Typing "/" in a note opens the slash menu; its items light up in turn. */
export function NoteLive() {
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref, ({ g, root, calm }) => {
    const slash = root.querySelector("[data-slash]");
    const menu = root.querySelector("[data-menu]");
    const items = [...root.querySelectorAll<HTMLElement>("[data-item]")];
    if (calm) return void showNow(g, [slash, menu]);
    const tl = g.timeline({ repeat: -1, repeatDelay: 1.2 });
    tl.set(items, { attr: { "data-on": "false" } });
    tl.fromTo(slash, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0.6);
    tl.fromTo(menu, { autoAlpha: 0, y: 12, scale: 0.95 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(2)" }, 0.9);
    items.forEach((el, i) => {
      const at = 1.7 + i * 0.6;
      tl.set(items, { attr: { "data-on": "false" } }, at);
      tl.set(el, { attr: { "data-on": "true" } }, at);
    });
    tl.to(menu, { autoAlpha: 0, y: 8, duration: 0.4 }, 4.4);
    tl.to(slash, { autoAlpha: 0, duration: 0.2 }, 4.4);
    return () => void tl.kill();
  });
  return (
    <div ref={ref} className="mt-auto pt-5">
      <div className="rounded-r3 bg-white/70 p-4 shadow-glass">
        <div className="font-serif text-[22px] leading-tight tracking-[-0.02em] text-fg">Launch plan, v3</div>
        <div className="mt-3 flex flex-col gap-2">
          <div className={`${bar} w-full`} />
          <div className={`${bar} w-4/5`} />
          <div className={`${bar} w-11/12`} />
          <div className={`${bar} w-3/5`} />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {[
            ["at-blue", "Roadmap"],
            ["at-violet", "Ideas"],
            ["at-amber", "Pricing"],
          ].map(([c, l]) => (
            <span key={l} className={`${c} tint rounded-pill px-2.5 py-0.5 text-[12px]`}>
              {l}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-r2 bg-(--abf)/8 px-3 py-2 text-[12.5px] text-fg-muted">
          <FA icon={faMicrophone} className="text-(--abf)" /> Dictate
          <span className="mx-1 text-fg-faint">·</span> 2 attachments
          <span className="mx-1 text-fg-faint">·</span> 5 versions
        </div>
        <div className="mt-3 flex items-center gap-1 text-[14px] text-fg-muted">
          <span data-slash data-reveal className="font-mono text-(--abf) opacity-0">
            /
          </span>
          <i className="h-4 w-px animate-pulse bg-fg motion-reduce:animate-none" aria-hidden />
        </div>
      </div>
      <div data-menu data-reveal className="liquid-dark mt-2 w-[210px] rounded-r2 p-1.5 opacity-0">
        {["Heading", "Bulleted list", "To-do", "Quote"].map((t) => (
          <div
            key={t}
            data-item
            data-on="false"
            className="flex items-center gap-2.5 rounded-r1 px-2.5 py-1.5 text-[13px] data-[on=true]:bg-white/20"
          >
            <span className="font-mono text-[12px] text-on-dark/60">¶</span>
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

const TASKS: [string, string][] = [
  ["Draft announcement", "Urgent"],
  ["Review pricing page", "High"],
  ["Send recap to the team", "Medium"],
  ["Book the venue", "Low"],
];

/** Click a task to complete it: the box pops, the line strikes through and the progress bar fills. */
export function TaskLive() {
  const [done, setDone] = useState([true, false, false, false]);
  const n = done.filter(Boolean).length;
  const toggle = (i: number, el: HTMLElement) => {
    setDone((d) => d.map((v, k) => (k === i ? !v : v)));
    const box = el.querySelector("[data-box]");
    if (box && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void import("gsap").then(({ default: gsap }) => gsap.fromTo(box, { scale: 0.55 }, { scale: 1, duration: 0.6, ease: "back.out(3)" }));
    }
  };
  return (
    <div className="mt-auto pt-5">
      <div className="flex flex-col gap-1.5">
        {TASKS.map(([t, p], i) => (
          <button
            key={t}
            type="button"
            role="checkbox"
            aria-checked={done[i]}
            onClick={(e) => toggle(i, e.currentTarget)}
            data-cursor={done[i] ? "Undo" : "Done"}
            className="flex items-center gap-2.5 rounded-r2 bg-white/60 px-3 py-2 text-left transition-colors duration-300 hover:bg-white/90"
          >
            <span
              data-box
              className={`grid size-[18px] shrink-0 place-items-center rounded-full transition-colors duration-300 ${done[i] ? "bg-(--abf) text-white" : "shadow-[inset_0_0_0_1.5px_var(--abl)]"}`}
            >
              {done[i] && <FA icon={faCheck} className="text-[9px]" />}
            </span>
            <span
              className={`flex-1 text-[13.5px] transition-[color,text-decoration-color] duration-300 ${done[i] ? "text-fg-subtle line-through" : "text-fg"}`}
            >
              {t}
            </span>
            <span className="text-[11.5px] text-fg-subtle">{p}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--abf)/15">
          <i
            className="block h-full rounded-full bg-(--abf) transition-[width] duration-500 ease-site"
            style={{ width: `${(n / TASKS.length) * 100}%` }}
          />
        </span>
        <span aria-live="polite" className="text-[12.5px] text-fg-muted tabular-nums">
          {n} of {TASKS.length} done
        </span>
      </div>
    </div>
  );
}

/** A voice entry being recorded: the waveform breathes and the timer counts. */
export function JournalLive() {
  const ref = useRef<HTMLDivElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  useMotion(ref, ({ g, root, calm }) => {
    if (calm) return;
    const bars = root.querySelectorAll("[data-bar]");
    const tw = g.to(bars, {
      scaleY: () => g.utils.random(0.25, 1),
      duration: 0.55,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      stagger: { each: 0.04, repeat: -1, yoyo: true },
    });
    const t = { s: 0 };
    const clock = g.to(t, {
      s: 59,
      duration: 59,
      ease: "none",
      repeat: -1,
      onUpdate: () => {
        if (time.current) time.current.textContent = `0:${String(Math.floor(t.s)).padStart(2, "0")}`;
      },
    });
    return () => {
      tw.kill();
      clock.kill();
    };
  });
  return (
    <div ref={ref} className="mt-auto pt-5">
      <div className="flex items-center gap-3 rounded-r3 bg-white/60 px-3.5 py-3 shadow-glass">
        <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-(--abf) text-[13px] text-white">
          <FA icon={faMicrophone} />
          <i aria-hidden className="absolute inset-0 animate-ping rounded-full bg-(--abf)/40 motion-reduce:animate-none" />
        </span>
        <span className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden>
          {Array.from({ length: 22 }, (_, i) => (
            <i
              key={i}
              data-bar
              className="h-full w-[3px] origin-center rounded-full bg-(--abf)/45"
              style={{ transform: `scaleY(${0.35 + ((i * 37) % 60) / 100})` }}
            />
          ))}
        </span>
        <span ref={time} className="font-mono text-[12.5px] text-fg-muted tabular-nums">
          0:24
        </span>
      </div>
      <div className="mt-3 text-[11.5px] font-semibold tracking-[0.1em] text-(--abf)/70 uppercase">Private to you</div>
    </div>
  );
}

const EVENTS: Record<number, [string, string]> = {
  8: ["at-green", "Planning"],
  11: ["at-blue", "1:1"],
  15: ["at-violet", "Gym"],
  18: ["at-amber", "Launch"],
  22: ["at-clay", "Lunch"],
};
const TASK_DAYS = [10, 18, 24];

/** Three weeks of a month. "Tasks" overlays due dates, exactly like the real calendar. */
export function CalendarLive() {
  const [tasks, setTasks] = useState(true);
  const days = Array.from({ length: 21 }, (_, i) => i + 5);
  return (
    <div className="mt-auto pt-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-serif text-[18px] tracking-[-0.015em] text-fg">October 2026</span>
        <button
          type="button"
          aria-pressed={tasks}
          onClick={() => setTasks((v) => !v)}
          className={`rounded-pill px-3 py-1 text-[12.5px] transition-colors duration-300 ${tasks ? "bg-(--abf) text-white" : "bg-white/70 text-fg-muted hover:bg-white"}`}
        >
          Tasks {tasks ? "on" : "off"}
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <div key={d} className="group min-h-[52px] rounded-r1 bg-white/55 p-1.5 transition-colors duration-200 hover:bg-white/90">
            <span
              className={`inline-grid size-5 place-items-center rounded-full text-[11.5px] ${d === 18 ? "bg-fg text-on-dark" : "text-fg-subtle"}`}
            >
              {d}
            </span>
            {EVENTS[d] && (
              <span className={`${EVENTS[d][0]} tint mt-0.5 block truncate rounded-[5px] px-1 text-[11px]`}>{EVENTS[d][1]}</span>
            )}
            {tasks && TASK_DAYS.includes(d) && (
              <span className="mt-0.5 block truncate rounded-[5px] border-l-2 border-l-orange-fg bg-surface-sunken px-1 text-[11px] text-fg-muted">
                Task
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Ask → preview → confirm, on a loop. Nothing is saved until the confirm button is pressed. */
export function ChatLive() {
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref, ({ g, root, calm }) => {
    const q = (s: string) => root.querySelector(s);
    const user = q("[data-user]");
    const dots = q("[data-dots]");
    const draft = q("[data-draft]");
    const confirm = q("[data-confirm]");
    const saved = q("[data-saved]");
    if (calm) return void showNow(g, [user, draft]);
    const tl = g.timeline({ repeat: -1, repeatDelay: 0.8 });
    tl.set([user, dots, draft, saved], { autoAlpha: 0 });
    tl.fromTo(user, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, 0.4);
    tl.to(dots, { autoAlpha: 1, duration: 0.2 }, 1.1);
    tl.to(dots, { autoAlpha: 0, duration: 0.2 }, 2.1);
    tl.fromTo(draft, { y: 16, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.6, ease: "back.out(1.6)" }, 2.1);
    tl.to(confirm, { scale: 0.92, duration: 0.12, yoyo: true, repeat: 1 }, 3.6);
    tl.fromTo(saved, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }, 3.9);
    tl.to([user, draft, saved], { autoAlpha: 0, duration: 0.5 }, 6);
    return () => void tl.kill();
  });
  return (
    <div ref={ref} className="relative mt-auto flex flex-col gap-2 pt-5">
      <div data-user data-reveal className="ml-auto rounded-r3 rounded-br-r1 bg-fg px-3.5 py-2 text-[13.5px] text-on-dark opacity-0">
        Turn that into a task for Friday.
      </div>
      <div data-dots data-reveal aria-hidden className="absolute top-[58px] left-1 flex gap-1 opacity-0">
        {[0, 1, 2].map((i) => (
          <i
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-(--abf)/50 motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <div
        data-draft
        data-reveal
        className="max-w-[92%] rounded-r3 rounded-bl-r1 bg-white/85 px-3.5 py-3 text-[13.5px] text-fg shadow-e1 opacity-0"
      >
        <span className="mb-1 flex items-center gap-1.5 text-[12px] text-(--abf)">
          <FA icon={faWandMagicSparkles} /> Draft task
        </span>
        Send the recap to the team
        <span className="mt-2 flex items-center gap-2">
          <span className="rounded-pill bg-surface-sunken px-3 py-1 text-[12px] text-fg-muted">Not now</span>
          <span data-confirm className="rounded-pill bg-fg px-3 py-1 text-[12px] text-on-dark">
            Confirm and save
          </span>
          <span data-saved data-reveal className="flex items-center gap-1 text-[12px] text-green-fg opacity-0">
            <FA icon={faCheck} className="text-[10px]" /> Saved
          </span>
        </span>
      </div>
    </div>
  );
}

const QUERIES: { q: string; rows: [string, string][] }[] = [
  {
    q: "launch plan",
    rows: [
      ["Note", "Launch plan, v3"],
      ["Task", "Review launch checklist"],
      ["Chat", "Launch notes"],
    ],
  },
  {
    q: "send recap",
    rows: [
      ["Task", "Send recap to the team"],
      ["Journal", "Friday recap"],
      ["Chat", "Recap draft"],
    ],
  },
  {
    q: "pricing",
    rows: [
      ["Note", "Pricing page copy"],
      ["Task", "Review pricing page"],
      ["Journal", "Thoughts on pricing"],
    ],
  },
];

/** A ⌘K palette that types a query and lists matches across your tasks, notes, journal and chats. */
export function SearchLive() {
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref, ({ g, root, calm }) => {
    if (calm) return;
    const typed = root.querySelector<HTMLElement>("[data-typed]");
    const rows = [...root.querySelectorAll<HTMLElement>("[data-row]")];
    if (!typed) return;
    const tl = g.timeline({ repeat: -1 });
    QUERIES.forEach(({ q, rows: found }) => {
      const o = { n: 0 };
      tl.call(() => {
        typed.textContent = "";
        rows.forEach((r, i) => {
          r.querySelector("[data-kind]")!.textContent = found[i][0];
          r.querySelector("[data-title]")!.textContent = found[i][1];
        });
      });
      tl.to(rows, { autoAlpha: 0, y: 6, duration: 0.01 });
      tl.to(o, {
        n: q.length,
        duration: q.length * 0.09,
        ease: "none",
        onUpdate: () => {
          typed.textContent = q.slice(0, Math.round(o.n));
        },
      });
      tl.to(rows, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power3.out" }, ">+0.15");
      tl.to({}, { duration: 1.6 });
    });
    return () => void tl.kill();
  });
  const first = QUERIES[0];
  return (
    <div ref={ref} className="mt-auto pt-5">
      <div className="overflow-hidden rounded-r3 bg-white/75 shadow-glass">
        <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-2.5">
          <FA icon={faMagnifyingGlass} className="text-[13px] text-fg-subtle" />
          <span className="flex-1 text-[14px] text-fg">
            <span data-typed>{first.q}</span>
            <i className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-fg motion-reduce:animate-none" aria-hidden />
          </span>
          <kbd className="rounded-r1 bg-surface-sunken px-1.5 py-0.5 font-mono text-[11.5px] text-fg-muted">⌘K</kbd>
        </div>
        <ul>
          {first.rows.map(([kind, title]) => (
            <li key={title} data-row className="flex items-center gap-2.5 px-3.5 py-2 text-[13.5px]">
              <span data-kind className="w-[52px] rounded-pill bg-(--abf)/10 px-2 py-0.5 text-center text-[11px] text-(--abf)">
                {kind}
              </span>
              <span data-title className="truncate text-fg">
                {title}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
