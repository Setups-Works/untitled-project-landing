"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Glass from "../Glass";
import { CALENDAR_POINTS, CHAT_POINTS, JOURNAL_POINTS, NOTE_POINTS, TASK_POINTS } from "../content";
import { Eyebrow, Lead, Title, WRAP } from "../Kit";
import { showNow, useMotion } from "../motion";
import { Parallax } from "../Parallax";
import { R, Reveal } from "../Reveal";
import { Tip } from "../Tip";
import { CalendarMock, ChatMock, JournalMock, NoteMock, TaskMock } from "./Mocks";
import type { Tone } from "../../../lib/tones";

type Point = [IconDefinition, string, string];

type Item = {
  id: string;
  tone: Tone;
  eyebrow: string;
  title: string;
  quiet: string;
  lead: string;
  points: Point[];
  visual: ReactNode;
  flip?: boolean;
};

const ITEMS: Item[] = [
  {
    id: "notes",
    tone: "blue",
    eyebrow: "Notes",
    title: "Your notes.",
    quiet: "Your way.",
    lead: "Write, organise and come back to it later. Use AI when it helps. Ignore it when it doesn’t.",
    points: NOTE_POINTS,
    visual: <NoteMock />,
  },
  {
    id: "tasks",
    tone: "amber",
    eyebrow: "Tasks",
    title: "Plan next to",
    quiet: "the work.",
    lead: "Lists, priorities and repeats that fit how you actually work, and a keyboard shortcut for nearly everything.",
    points: TASK_POINTS,
    visual: <TaskMock />,
    flip: true,
  },
  {
    id: "journal",
    tone: "violet",
    eyebrow: "Journal",
    title: "Your days.",
    quiet: "Your record.",
    lead: "A private place to write down your days and come back to them later, kept close to the work.",
    points: JOURNAL_POINTS,
    visual: <JournalMock />,
  },
  {
    id: "calendar",
    tone: "green",
    eyebrow: "Calendar",
    title: "One view of where",
    quiet: "your time goes.",
    lead: "Your events and your tasks on the same page, in the view that suits the moment.",
    points: CALENDAR_POINTS,
    visual: <CalendarMock />,
    flip: true,
  },
  {
    id: "chat",
    tone: "mint",
    eyebrow: "Chat with AI",
    title: "An assistant that",
    quiet: "asks first.",
    lead: "Talk to the model you choose, right beside your work. It can draft things for you, and you decide what to keep.",
    points: CHAT_POINTS,
    visual: <ChatMock />,
  },
];

/** Where each stacked panel pins, below the floating header. */
const PIN = 88;

/**
 * One feature: the story on one side, an illustration on the other (they swap sides down the page). The illustration swings in
 * from a 3D angle as it scrolls into view and the points arrive one after another. Hover a point for the detail.
 */
function Showcase({ tone, eyebrow, title, quiet, lead, points, visual, flip = false }: Omit<Item, "id">) {
  const art = useRef<HTMLDivElement>(null);
  useMotion(art, ({ g, root, calm }) => {
    if (calm) return void showNow(g, root);
    g.fromTo(
      root,
      { rotationY: flip ? -16 : 16, rotationX: 6, x: flip ? -60 : 60, autoAlpha: 0, transformPerspective: 1300 },
      {
        rotationY: 0,
        rotationX: 0,
        x: 0,
        autoAlpha: 1,
        duration: 1.3,
        ease: "power3.out",
        scrollTrigger: { trigger: root, start: "top 85%", once: true },
      },
    );
  });
  return (
    <div className={WRAP}>
      {/* A solid cream layer under the glass, so a panel being covered by the next one doesn't show through it. */}
      <div className="relative rounded-r5 bg-page">
        {/* Dims the panel as the next one covers it, without making it see-through. */}
        <span data-shade aria-hidden className="pointer-events-none absolute inset-0 z-20 rounded-r5 bg-fill-dark opacity-0" />
        <Glass radius="r5" tone={tone} className="overflow-hidden p-[clamp(20px,4vw,56px)]">
          <div className={`grid items-center gap-[clamp(28px,5vw,64px)] lg:grid-cols-2 ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
            <div className="flex flex-col items-start gap-5">
              <Reveal>
                <Eyebrow>{eyebrow}</Eyebrow>
              </Reveal>
              <Title quiet={quiet}>{title}</Title>
              <Reveal delay={150}>
                <Lead>{lead}</Lead>
              </Reveal>
              <Reveal stagger={0.08} className="mt-2 grid w-full gap-2.5 sm:grid-cols-2">
                {points.map(([icon, t, d]) => (
                  <R key={t}>
                    <Tip content={d} className="flex w-full">
                      <div
                        tabIndex={0}
                        className="liquid-flat group flex w-full cursor-default items-center gap-3 rounded-r2 px-3.5 py-3 transition-transform duration-300 ease-site hover:-translate-y-0.5"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-r1 bg-(--abf)/10 text-[13px] text-(--abf)">
                          <FA icon={icon} />
                        </span>
                        <span className="text-[14px] leading-tight font-medium text-fg">{t}</span>
                      </div>
                    </Tip>
                  </R>
                ))}
              </Reveal>
            </div>
            <Parallax speed={flip ? -36 : 36}>
              <div ref={art} data-reveal className="opacity-0">
                {visual}
                <p className="mt-3 text-center text-[12px] text-fg-faint">Sample content, shown for illustration.</p>
              </div>
            </Parallax>
          </div>
        </Glass>
      </div>
    </div>
  );
}

/**
 * The five feature panels stack one by one: each pins under the header while the next slides up over it, and the panel being
 * covered settles back (smaller, dimmer) as the next arrives. Pinning is for wide screens; on phones the panels simply follow
 * each other. Because a pinned panel's position changes as you scroll, links to #notes, #tasks… are resolved from the panels'
 * natural positions so they always land on the right one.
 */
export default function DeepDives() {
  const col = useRef<HTMLDivElement>(null);

  useMotion(col, ({ g, root, calm }) => {
    if (calm || !window.matchMedia("(min-width: 1024px)").matches) return;
    const items = [...root.children] as HTMLElement[];
    items.slice(0, -1).forEach((item, i) => {
      const inner = item.firstElementChild as HTMLElement;
      const shade = item.querySelector("[data-shade]");
      const scrollTrigger = { trigger: items[i + 1], start: "top 70%", end: `top ${PIN + 16}px`, scrub: true };
      g.to(inner, { scale: 0.93, transformOrigin: "50% 0%", ease: "none", scrollTrigger });
      g.to(shade, { opacity: 0.14, ease: "none", scrollTrigger });
    });
  });

  useEffect(() => {
    const ids = ITEMS.map((i) => i.id);
    const jump = (id: string, smooth: boolean) => {
      const el = col.current;
      const idx = ids.indexOf(id);
      if (!el || idx < 0) return false;
      const items = [...el.children] as HTMLElement[];
      if (getComputedStyle(items[idx]).position !== "sticky") return false; // phones: native anchors work
      const gap = parseFloat(getComputedStyle(el).rowGap) || 0;
      let y = el.getBoundingClientRect().top + window.scrollY;
      for (let k = 0; k < idx; k++) y += items[k].offsetHeight + gap;
      window.scrollTo({ top: y - PIN - 8, behavior: smooth ? "smooth" : "auto" });
      return true;
    };
    const idOf = (a: HTMLAnchorElement | null) => {
      const h = a?.getAttribute("href") ?? "";
      if (h.startsWith("#")) return h.slice(1);
      if (h.startsWith("/#") && window.location.pathname === "/") return h.slice(2);
      return "";
    };
    const click = (e: MouseEvent) => {
      const id = idOf((e.target as HTMLElement).closest("a"));
      if (id && jump(id, true)) {
        e.preventDefault();
        history.replaceState(null, "", `#${id}`);
      }
    };
    document.addEventListener("click", click);
    const h = window.location.hash.slice(1);
    const t = h ? setTimeout(() => jump(h, false), 500) : undefined;
    return () => {
      document.removeEventListener("click", click);
      if (t) clearTimeout(t);
    };
  }, []);

  return (
    <div ref={col} className="relative flex flex-col gap-[clamp(24px,4vw,40px)] pb-[clamp(24px,4vw,56px)]">
      {ITEMS.map(({ id, ...rest }, i) => (
        <div key={id} id={id} style={{ zIndex: i + 1, top: PIN }} className="scroll-mt-24 rounded-r5 py-0 lg:sticky">
          <Showcase {...rest} />
        </div>
      ))}
    </div>
  );
}
