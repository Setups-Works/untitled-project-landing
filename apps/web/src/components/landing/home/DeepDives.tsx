"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Glass from "../Glass";
import { CALENDAR_POINTS, CHAT_POINTS, COLLAB_POINTS, JOURNAL_POINTS, NOTE_POINTS, TASK_POINTS } from "../content";
import { Eyebrow, Lead, Title, WRAP } from "../Kit";
import { useMotion } from "../motion";
import { CollabScreen } from "./Mocks";
import PhoneHalf from "./PhoneHalf";
import { R, Reveal } from "../Reveal";
import { Tip } from "../Tip";
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
  flip?: boolean;
  /** A phone screenshot tucked into the panel's bottom edge, showing its top half. */
  phone?: { src?: string; alt: string; screen?: ReactNode };
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
    phone: { src: "/mobile/notes.png", alt: "The notes screen in the phone app" },
  },
  {
    id: "tasks",
    tone: "amber",
    eyebrow: "Tasks",
    title: "Plan next to",
    quiet: "the work.",
    lead: "Lists, priorities and repeats that fit how you actually work, and a keyboard shortcut for nearly everything.",
    points: TASK_POINTS,
    phone: { src: "/mobile/todo.png", alt: "The to-do screen in the phone app" },
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
    phone: { src: "/mobile/journal.png", alt: "The journal screen in the phone app" },
  },
  {
    id: "collaborate",
    tone: "clay",
    eyebrow: "Collaborate",
    title: "Write it",
    quiet: "together.",
    lead: "Keep a journal with the people close to you. You choose who can write and who can only read, and they join when they accept.",
    points: COLLAB_POINTS,
    phone: { alt: "The shared journal screen in the phone app", screen: <CollabScreen /> },
    flip: true,
  },
  {
    id: "calendar",
    tone: "green",
    eyebrow: "Calendar",
    title: "One view of where",
    quiet: "your time goes.",
    lead: "Your events and your tasks on the same page, in the view that suits the moment.",
    points: CALENDAR_POINTS,
    phone: { src: "/mobile/home.png", alt: "The home screen in the phone app" },
  },
  {
    id: "chat",
    tone: "mint",
    eyebrow: "Chat with AI",
    title: "An assistant that",
    quiet: "asks first.",
    lead: "Talk to the model you choose, right beside your work. It can draft things for you, and you decide what to keep.",
    points: CHAT_POINTS,
    phone: { src: "/mobile/chat.png", alt: "The chat screen in the phone app" },
    flip: true,
  },
];

/** Where each stacked panel pins, below the floating header. */
const PIN = 88;

/**
 * One feature: the story on one side and a phone showing the app on the other (they swap sides down the page), tucked into the
 * panel's bottom edge. The points arrive one after another; hover one for the detail.
 */
function Showcase({ tone, eyebrow, title, quiet, lead, points, flip = false, phone }: Omit<Item, "id">) {
  return (
    <div className={WRAP}>
      {/* A solid cream layer under the glass, so a panel being covered by the next one doesn't show through it. */}
      <div className="relative rounded-r5 bg-page">
        {/* Dims the panel as the next one covers it, without making it see-through. */}
        <span data-shade aria-hidden className="pointer-events-none absolute inset-0 z-20 rounded-r5 bg-fill-dark opacity-0" />
        <Glass radius="r5" tone={tone} className="overflow-hidden p-[clamp(20px,4vw,56px)]">
          <div className={`flex flex-col items-start gap-5 lg:max-w-[48%] ${flip ? "lg:ml-auto" : ""}`}>
            <div className="contents">
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
          </div>
          {phone && (
            <>
              {/* Phones: room under the text for the half phone, which is centred on the panel's bottom edge. Wide screens: it sits at the side. */}
              <div aria-hidden className="h-[min(250px,70vw)] w-full lg:hidden" />
              <PhoneHalf
                src={phone.src}
                alt={phone.alt}
                className={`bottom-0 left-1/2 w-[min(260px,72vw)] -translate-x-1/2 lg:translate-x-0 lg:w-[clamp(260px,28vw,400px)] ${flip ? "lg:left-[5%]" : "lg:left-auto lg:right-[5%]"}`}
              >
                {phone.screen}
              </PhoneHalf>
            </>
          )}
        </Glass>
      </div>
    </div>
  );
}

/**
 * The six feature panels stack one by one: each pins under the header while the next slides up over it, and the panel being
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
